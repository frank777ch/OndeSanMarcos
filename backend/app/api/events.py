"""Eventos próximos del campus, de solo lectura y sin autenticación.

- `GET /api/events`

Solo salen eventos publicados, no cancelados y que aún no terminaron, por fecha de inicio. Un evento
sin lugar (virtual) también sale: quien lo muestre en el mapa decide qué hacer con él. La respuesta
lleva `Cache-Control` y `ETag` (ver `app.api.caching`).
"""

from __future__ import annotations

from typing import Any, Protocol

from fastapi import APIRouter, Depends, Request, Response
from pydantic import TypeAdapter

from app.api.caching import cached_json
from app.config import get_settings
from app.rag.db import get_database
from app.schemas.events import EventOut

router = APIRouter(prefix="/api", tags=["events"])

_EVENTS = TypeAdapter(list[EventOut])

_CACHE_HEADERS: dict[str, Any] = {
    "Cache-Control": {"description": "public, max-age=60", "schema": {"type": "string"}},
    "ETag": {"description": "Hash del contenido, para If-None-Match.", "schema": {"type": "string"}},
}
_RESPONSES: dict[int | str, dict[str, Any]] = {
    304: {"description": "El contenido no cambió (If-None-Match coincide).", "headers": _CACHE_HEADERS},
    503: {"description": "La base de datos no responde."},
}


class EventsStore(Protocol):
    def upcoming_events(self) -> list[dict]: ...


def get_events_store() -> EventsStore:
    """Base de datos de eventos (se reemplaza en los tests)."""
    return get_database(get_settings())


@router.get("/events", response_model=list[EventOut], responses=_RESPONSES, summary="Eventos próximos")
def list_events(request: Request, store: EventsStore = Depends(get_events_store)) -> Response:
    """Eventos publicados, no cancelados y que aún no terminaron, por fecha de inicio. Cacheable 60 s."""
    return cached_json(request, _EVENTS, store.upcoming_events())
