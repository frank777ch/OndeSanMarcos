"""Proveedores de embeddings (vectorización de texto).

`BagOfWordsEmbedding` es un vectorizador determinista y sin dependencias: se
ajusta al vocabulario del corpus y representa cada texto como un vector de
frecuencias de términos (norma unitaria). No captura semántica profunda como
un modelo neuronal, pero sí la coincidencia léxica de forma **exacta** (sin
colisiones), lo que basta para probar el pipeline RAG de forma aislada.

El proveedor real (`GeminiEmbedding`, embeddings densos de Gemini) se enchufa
en la misma interfaz `EmbeddingProvider`.
"""

from __future__ import annotations

import math
import re
from collections.abc import Iterable
from typing import Protocol

from app.knowledge.places import normalize

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Palabras vacías frecuentes en español: se descartan para reducir ruido.
_STOPWORDS: frozenset[str] = frozenset(
    {
        "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o",
        "en", "a", "que", "como", "donde", "cual", "esta", "este", "esto",
        "por", "para", "con", "del", "al", "se", "su", "sus", "mi", "tu",
        "es", "hay", "me", "te", "lo", "le", "ya", "muy", "mas",
    }
)


def tokenize(text: str) -> list[str]:
    """Normaliza, separa en tokens y descarta palabras vacías."""
    return [tok for tok in _TOKEN_RE.findall(normalize(text)) if tok not in _STOPWORDS]


def build_vocabulary(texts: Iterable[str]) -> list[str]:
    """Construye el vocabulario ordenado a partir de varios textos."""
    vocab: set[str] = set()
    for text in texts:
        vocab.update(tokenize(text))
    return sorted(vocab)


class EmbeddingProvider(Protocol):
    """Interfaz de un proveedor de embeddings."""

    @property
    def dim(self) -> int: ...

    def embed(self, text: str) -> list[float]: ...


class BagOfWordsEmbedding:
    """Vectorizador de frecuencias de términos ajustado a un vocabulario."""

    def __init__(self, vocabulary: Iterable[str]) -> None:
        self._index: dict[str, int] = {
            token: position for position, token in enumerate(vocabulary)
        }

    @property
    def dim(self) -> int:
        return len(self._index)

    def embed(self, text: str) -> list[float]:
        """Vector de norma unitaria con la frecuencia de tokens conocidos."""
        vector = [0.0] * self.dim
        for token in tokenize(text):
            position = self._index.get(token)
            if position is not None:
                vector[position] += 1.0

        norm = math.sqrt(sum(value * value for value in vector))
        if norm > 0.0:
            vector = [value / norm for value in vector]
        return vector


def _normalize(values: list[float]) -> list[float]:
    """Devuelve el vector con norma unitaria (0 si es nulo)."""
    norm = math.sqrt(sum(v * v for v in values))
    return [v / norm for v in values] if norm > 0.0 else values


class GeminiEmbedding:
    """Proveedor de embeddings real basado en Gemini (`google-genai`).

    Implementa la misma interfaz `EmbeddingProvider`. Usa embeddings
    **asimétricos**: `RETRIEVAL_DOCUMENT` para los fragmentos del corpus y
    `RETRIEVAL_QUERY` para la consulta, lo que mejora el recall. El SDK
    `google-genai` es opcional (`requirements-llm.txt`) y se importa perezosamente.
    Normaliza a norma unitaria (Gemini no normaliza cuando la dimensión no es la
    máxima; con norma 1 el coseno de pgvector queda bien definido).
    """

    def __init__(
        self, api_key: str, model: str = "gemini-embedding-001", dim: int = 768
    ) -> None:
        try:
            from google import genai  # import perezoso
        except ImportError as exc:  # pragma: no cover - depende de extra opcional
            raise ImportError(
                "Falta el paquete 'google-genai'. Instálalo con "
                "`pip install -r requirements-llm.txt`."
            ) from exc
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self._dim = dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed(self, text: str) -> list[float]:
        """Embedding de una consulta (`RETRIEVAL_QUERY`)."""
        return self._embed(text, "RETRIEVAL_QUERY")

    def embed_document(self, text: str) -> list[float]:
        """Embedding de un documento del corpus (`RETRIEVAL_DOCUMENT`)."""
        return self._embed(text, "RETRIEVAL_DOCUMENT")

    def _embed(self, text: str, task_type: str) -> list[float]:  # pragma: no cover - red/llave
        from google.genai import types

        response = self._client.models.embed_content(
            model=self._model,
            contents=text,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=self._dim,
            ),
        )
        return _normalize(list(response.embeddings[0].values))
