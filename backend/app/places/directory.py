"""Directorio de lugares del asistente (HU-29).

Responde dos preguntas del motor RAG: «¿qué lugares nombra esta consulta?» y «¿cuáles están
publicados?». Los datos salen de la tabla `places`, que es la fuente de verdad una vez cargada la
semilla; en modo mock (tests, sin base) salen de `db/seed/places.json`, la misma fuente.

- La lista se guarda en memoria y caduca a los `ttl` segundos; `invalidate()` la refresca de
  inmediato (la llama `RagPlaceSync` tras crear, editar o despublicar un lugar).
- La coincidencia exige límite de palabra: la palabra clave «pre» no coincide dentro de
  «presupuesto».
"""

from __future__ import annotations

import json
import re
import threading
import time
from collections.abc import Callable
from functools import lru_cache
from pathlib import Path

from app.knowledge.corpus import Document
from app.knowledge.places import CampusPlace, Coordinate, normalize
from app.places.document import place_document

SEED_PATH = Path(__file__).resolve().parents[2] / "db" / "seed" / "places.json"
DEFAULT_TTL = 60.0

PlaceLoader = Callable[[], list[dict]]


# --- semilla -----------------------------------------------------------------


@lru_cache
def seed_places() -> list[dict]:
    """Lugares de `places.json` como filas de la tabla (con `category_label` y `parent_name`).

    Todos cuentan como publicados: la semilla no trae `is_published`.
    """
    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    labels = {c["slug"]: c["label"] for c in data["categories"]}
    names = {p["slug"]: p["name"] for p in data["places"]}
    return [
        {
            **place,
            "category_label": labels.get(place.get("category_slug")),
            "parent_name": names.get(place.get("parent_slug")),
            "is_published": True,
        }
        for place in data["places"]
    ]


def seed_place_documents() -> list[Document]:
    """Fichas de los lugares de la semilla (el corpus del modo mock, sin base)."""
    return [place_document(place) for place in seed_places()]


# --- conversión --------------------------------------------------------------


def campus_place(row: dict) -> CampusPlace:
    """Fila de `places` → lugar del motor. Su `id` es el slug, que es lo que la web usa."""
    keywords = [k for k in (row.get("keywords") or []) if k]
    for text in (row.get("name"), row.get("short_name")):
        if text and text not in keywords:
            keywords.append(text)
    return CampusPlace(
        id=row["slug"],
        name=row["name"],
        schedule=row.get("schedule") or "",
        keywords=tuple(keywords),
        coordinate=Coordinate(latitude=row["lat"], longitude=row["lng"]),
    )


def _matches(query: str, keyword: str) -> bool:
    """`keyword` aparece en `query` como palabra completa (ambas ya normalizadas)."""
    return re.search(rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])", query) is not None


# --- directorio --------------------------------------------------------------


class PlaceDirectory:
    """Lugares publicados, en memoria, con caducidad e invalidación."""

    def __init__(
        self,
        loader: PlaceLoader,
        *,
        ttl: float = DEFAULT_TTL,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._loader = loader
        self._ttl = ttl
        self._clock = clock
        self._lock = threading.Lock()
        self._places: dict[str, CampusPlace] = {}
        self._loaded_at: float | None = None

    def invalidate(self) -> None:
        """Descarta la copia en memoria: la próxima consulta vuelve a leer los lugares."""
        with self._lock:
            self._loaded_at = None

    def _all(self) -> dict[str, CampusPlace]:
        with self._lock:
            now = self._clock()
            if self._loaded_at is None or now - self._loaded_at >= self._ttl:
                self._places = {row["slug"]: campus_place(row) for row in self._loader()}
                self._loaded_at = now
            return self._places

    def find(self, query: str) -> list[CampusPlace]:
        """Lugares cuyo nombre, sigla o palabra clave aparece en la consulta (palabra completa).

        Van primero los que coinciden con el texto más largo: «facultad de ingeniería civil» nombra
        la facultad antes que su cafetería (que solo comparte «ingeniería civil»). La ruta del chat
        se traza hacia el primero. A igual longitud se conserva el orden de la lista.
        """
        normalized = normalize(query)
        found: list[tuple[int, CampusPlace]] = []
        for place in self._all().values():
            lengths = [len(k) for k in map(normalize, place.keywords) if _matches(normalized, k)]
            if lengths:
                found.append((max(lengths), place))
        found.sort(key=lambda pair: -pair[0])  # estable
        return [place for _, place in found]

    def get(self, slug: str) -> CampusPlace | None:
        return self._all().get(slug)

    def published_slugs(self) -> set[str]:
        return set(self._all())


def seed_directory() -> PlaceDirectory:
    """Directorio sobre `places.json`: modo mock y pruebas, sin base de datos."""
    return PlaceDirectory(seed_places)


@lru_cache
def get_place_directory() -> PlaceDirectory:
    """Directorio compartido por el motor y el sincronizador (un solo objeto por proceso).

    Sin base de datos o en modo mock lee la semilla; si no, la tabla `places`.
    """
    from app.config import get_settings
    from app.rag.db import get_database

    settings = get_settings()
    if settings.rag_use_mock or not settings.database_url:
        return seed_directory()
    return PlaceDirectory(get_database(settings).list_places)
