"""Sincronización de un lugar con el asistente (HU-30; HU-29).

Todo cambio de un lugar pasa por `PlaceSync.sync`. Con la base real, `RagPlaceSync` reemplaza la
ficha del lugar en `documents` (o la borra si se despublicó), con una sola llamada de embeddings por
fragmento. En modo de prueba o sin base, `NullPlaceSync` no hace nada y devuelve `"skipped"`.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from functools import lru_cache
from typing import Any, Literal, Protocol

from app.config import Settings, get_settings
from app.places.directory import PlaceDirectory, get_place_directory
from app.places.document import SOURCE_TYPE_PLACE, place_document
from app.rag.db import Database, get_database
from app.rag.ingestion import document_rows
from app.rag.providers import build_embedding_provider

logger = logging.getLogger(__name__)

RagSync = Literal["ok", "skipped", "failed"]


class PlaceSync(Protocol):
    def sync(self, place_id: int) -> RagSync: ...


class NullPlaceSync:
    def sync(self, place_id: int) -> RagSync:
        return "skipped"


class RagPlaceSync:
    """Mantiene al día la ficha de un lugar en el asistente (RF-29.5 a RF-29.7)."""

    def __init__(
        self,
        database: Database,
        embedding_factory: Callable[[], Any],
        settings: Settings,
        directory: PlaceDirectory,
    ) -> None:
        self._database = database
        # Se crea al sincronizar y no antes: una clave inválida o ausente debe salir como
        # `failed` con el lugar ya guardado, no impedir que se guarde (RF-30.24).
        self._embedding_factory = embedding_factory
        self._embedding: Any = None
        self._settings = settings
        self._directory = directory

    def sync(self, place_id: int) -> RagSync:
        # El lugar ya está guardado en `places`: el directorio debe verlo aunque el embedding falle.
        self._directory.invalidate()

        place = self._database.place_for_sync(place_id)
        if place is None:
            return "failed"

        slug = place["slug"]
        if not place["is_published"]:
            self._database.delete_source(SOURCE_TYPE_PLACE, slug)
            return "ok"

        if self._embedding is None:
            self._embedding = self._embedding_factory()
        # Primero se embebe y después se escribe: si el servicio falla, la ficha anterior queda intacta.
        rows = document_rows(place_document(place), self._embedding, self._settings, SOURCE_TYPE_PLACE)
        self._database.replace_source(SOURCE_TYPE_PLACE, slug, rows)
        return "ok"


@lru_cache
def _rag_place_sync() -> RagPlaceSync:
    settings = get_settings()
    return RagPlaceSync(
        get_database(settings),
        lambda: build_embedding_provider(settings),
        settings,
        get_place_directory(),
    )


def get_place_sync() -> PlaceSync:
    """Sincronizador de lugares (se reemplaza en los tests).

    Con el asistente en modo de prueba o sin base de datos no hay nada que sincronizar (RF-29.8).
    """
    settings = get_settings()
    if settings.rag_use_mock or not settings.database_url:
        return NullPlaceSync()
    return _rag_place_sync()


def safe_sync(sync: PlaceSync, place_id: int) -> RagSync:
    """Nunca lanza: un fallo se registra y se informa como `failed` (RF-30.24)."""
    try:
        return sync.sync(place_id)
    except Exception:
        logger.exception("No se pudo sincronizar el lugar %s con el asistente", place_id)
        return "failed"
