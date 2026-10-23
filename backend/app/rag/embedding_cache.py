"""Caché y reintentos para los embeddings de Gemini.

Cada llamada de embeddings consume cuota de la clave de Gemini, que es limitada.
Este módulo evita gastarla en vano:

- **Documentos**: cada embedding se guarda en disco (JSONL) con una clave que
  depende del texto, el modelo y la dimensión. Un texto ya embebido no se vuelve
  a pedir. El archivo sobrevive aunque se borre la base de datos.
- **Consultas**: una caché LRU en memoria evita repetir la misma pregunta.
- **Reintentos**: ante errores transitorios o de límite (429/5xx) se reintenta
  con espera creciente; si se agota, se falla con un mensaje claro y lo ya
  embebido queda guardado.
"""

from __future__ import annotations

import hashlib
import json
import time
from collections import OrderedDict
from collections.abc import Callable
from pathlib import Path
from typing import TypeVar

from app.rag.embeddings import EmbeddingProvider
from app.rag.errors import RagProviderError

T = TypeVar("T")

MAX_ATTEMPTS = 5
BASE_DELAY_SECONDS = 1.0
TRANSIENT_CODES = {429, 500, 502, 503, 504}


def _status_code(exc: BaseException) -> int | None:
    for attr in ("code", "status_code", "status"):
        value = getattr(exc, attr, None)
        if isinstance(value, int):
            return value
    return None


def is_transient(exc: BaseException) -> bool:
    """¿Vale la pena reintentar? Límite de uso, servicio caído o red."""
    if isinstance(exc, (TimeoutError, ConnectionError)):
        return True
    return _status_code(exc) in TRANSIENT_CODES


def with_retries(
    fn: Callable[[], T],
    *,
    attempts: int = MAX_ATTEMPTS,
    base_delay: float = BASE_DELAY_SECONDS,
    sleep: Callable[[float], None] = time.sleep,
) -> T:
    """Ejecuta `fn` reintentando errores transitorios con espera 1, 2, 4, 8, 16 s."""
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - se reclasifica abajo
            if not is_transient(exc):
                raise RagProviderError(f"Gemini devolvió un error: {exc}") from exc
            if attempt == attempts:
                raise RagProviderError(
                    f"Gemini no respondió tras {attempts} intentos (¿límite de uso de la "
                    "clave?). Lo ya embebido quedó guardado en la caché: vuelve a "
                    "intentarlo más tarde."
                ) from exc
            sleep(base_delay * 2 ** (attempt - 1))
    raise AssertionError("unreachable")  # pragma: no cover


class CachedEmbedding:
    """Envuelve un `EmbeddingProvider` con caché en disco, LRU y reintentos."""

    def __init__(
        self,
        inner: EmbeddingProvider,
        path: str | Path,
        *,
        model: str,
        dim: int,
        query_cache_size: int = 256,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._inner = inner
        self._path = Path(path)
        self._model = model
        self._dim = dim
        self._sleep = sleep
        self._query_cache: OrderedDict[str, list[float]] = OrderedDict()
        self._query_cache_size = query_cache_size
        self._documents: dict[str, list[float]] = self._load()
        self.hits = 0  # embeddings de documentos tomados de la caché
        self.misses = 0  # embeddings de documentos pedidos a Gemini

    @property
    def dim(self) -> int:
        return self._dim

    def _key(self, text: str) -> str:
        return hashlib.sha256(f"{self._model}|{self._dim}|{text}".encode()).hexdigest()

    def _load(self) -> dict[str, list[float]]:
        cache: dict[str, list[float]] = {}
        if not self._path.exists():
            return cache
        with self._path.open(encoding="utf-8") as fh:
            for line in fh:
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue  # línea cortada por una interrupción
                vector = item.get("v")
                if isinstance(vector, list) and len(vector) == self._dim:
                    cache[item["k"]] = vector
        return cache

    def embed_document(self, text: str) -> list[float]:
        key = self._key(text)
        cached = self._documents.get(key)
        if cached is not None:
            self.hits += 1
            return cached
        vector = with_retries(lambda: self._inner.embed_document(text), sleep=self._sleep)  # type: ignore[attr-defined]
        self.misses += 1
        self._documents[key] = vector
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with self._path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps({"k": key, "v": vector}) + "\n")
        return vector

    def embed(self, text: str) -> list[float]:
        """Embedding de una consulta, con caché LRU en memoria."""
        cached = self._query_cache.get(text)
        if cached is not None:
            self._query_cache.move_to_end(text)
            return cached
        vector = with_retries(lambda: self._inner.embed(text), sleep=self._sleep)
        self._query_cache[text] = vector
        if len(self._query_cache) > self._query_cache_size:
            self._query_cache.popitem(last=False)
        return vector
