"""Sincronización de un evento con el asistente.

Todo cambio de un evento pasa por `EventSync.sync`. Con la base real, `RagEventSync` reemplaza el
documento del evento en `documents` (`source_type='event'`), o lo borra si se despublicó o ya terminó.
En modo de prueba o sin base, `NullEventSync` no hace nada y devuelve `"skipped"`.

El documento lleva `expires_at`: aunque nadie lo borre, la búsqueda (`match_documents`, V13) deja de
devolverlo cuando el evento termina.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Protocol

from app.config import Settings, get_settings
from app.events.document import SOURCE_TYPE_EVENT, event_document, event_expires_at
from app.events.timeutil import expires_at
from app.places.sync import RagSync
from app.rag.db import Database, get_database
from app.rag.ingestion import document_rows
from app.rag.providers import build_embedding_provider

logger = logging.getLogger(__name__)


class EventSync(Protocol):
    def sync(self, event_id: int) -> RagSync: ...
    def remove(self, slug: str) -> RagSync: ...


class NullEventSync:
    def sync(self, event_id: int) -> RagSync:
        return "skipped"

    def remove(self, slug: str) -> RagSync:
        return "skipped"


class RagEventSync:
    """Mantiene al día el documento de un evento en el asistente."""

    def __init__(self, database: Database, embedding_factory: Callable[[], Any], settings: Settings) -> None:
        self._database = database
        # Se crea al sincronizar y no antes: una clave inválida debe salir como `failed` con el
        # evento ya guardado, no impedir que se guarde.
        self._embedding_factory = embedding_factory
        self._embedding: Any = None
        self._settings = settings

    def sync(self, event_id: int) -> RagSync:
        event = self._database.event_for_sync(event_id)
        if event is None:
            return "failed"

        slug = event["slug"]
        finished = expires_at(event["starts_at"], event.get("ends_at")) <= datetime.now(timezone.utc)
        if not event["is_published"] or finished:
            self._database.delete_source(SOURCE_TYPE_EVENT, slug)
            return "ok"

        if self._embedding is None:
            self._embedding = self._embedding_factory()
        # Primero se embebe y después se escribe: si el servicio falla, el documento anterior queda intacto.
        rows = document_rows(
            event_document(event),
            self._embedding,
            self._settings,
            SOURCE_TYPE_EVENT,
            source_id=slug,
            expires_at=event_expires_at(event),
            single_chunk=True,
        )
        self._database.replace_source(SOURCE_TYPE_EVENT, slug, rows)
        return "ok"

    def remove(self, slug: str) -> RagSync:
        """El evento ya se borró de `events`: se quita su documento del asistente."""
        self._database.delete_source(SOURCE_TYPE_EVENT, slug)
        return "ok"


@lru_cache
def _rag_event_sync() -> RagEventSync:
    settings = get_settings()
    return RagEventSync(get_database(settings), lambda: build_embedding_provider(settings), settings)


def get_event_sync() -> EventSync:
    """Sincronizador de eventos (se reemplaza en los tests).

    Con el asistente en modo de prueba o sin base de datos no hay nada que sincronizar.
    """
    settings = get_settings()
    if settings.rag_use_mock or not settings.database_url:
        return NullEventSync()
    return _rag_event_sync()


def safe_sync(sync: EventSync, event_id: int) -> RagSync:
    """Nunca lanza: un fallo se registra y se informa como `failed`."""
    try:
        return sync.sync(event_id)
    except Exception:
        logger.exception("No se pudo sincronizar el evento %s con el asistente", event_id)
        return "failed"


def safe_remove(sync: EventSync, slug: str) -> RagSync:
    """Como `safe_sync`, para un evento borrado."""
    try:
        return sync.remove(slug)
    except Exception:
        logger.exception("No se pudo quitar el evento %s del asistente", slug)
        return "failed"
