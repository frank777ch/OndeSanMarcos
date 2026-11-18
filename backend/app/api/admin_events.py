"""Administración de eventos. Requiere sesión de administrador.

Un evento se puede despublicar (`is_published`) o borrar. El `id` y el `slug` los asigna el sistema.
Cada cambio se sincroniza con el asistente; si eso falla el evento queda guardado y `rag_sync` avisa.
"""

from __future__ import annotations

import logging
from typing import Any, Protocol

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.auth.dependencies import get_current_admin
from app.config import get_settings
from app.events import service
from app.events.sync import EventSync, get_event_sync, safe_remove, safe_sync
from app.places.text import normalize_text, parse_place_id
from app.rag.db import get_database
from app.schemas.events_admin import EventAdminOut, EventDeletedOut, EventIn, EventSavedOut

logger = logging.getLogger(__name__)

_AUTH: dict[int | str, dict[str, Any]] = {401: {"description": "Falta la sesión de administrador o venció."}}
_DB: dict[int | str, dict[str, Any]] = {**_AUTH, 503: {"description": "La base de datos no responde."}}

router = APIRouter(prefix="/api/admin/events", tags=["admin-events"])


class AdminEventsStore(Protocol):
    def admin_list_events(self, place_id: int | None = None, published: bool | None = None) -> list[dict]: ...
    def admin_get_event(self, event_id: int) -> dict | None: ...
    def event_exists(self, event_id: int) -> bool: ...
    def place_exists(self, place_id: int) -> bool: ...
    def create_event(self, data: dict, username: str) -> dict: ...
    def update_event(self, event_id: int, data: dict, username: str) -> dict | None: ...
    def delete_event(self, event_id: int) -> tuple[str, str | int]: ...


def get_admin_events_store() -> AdminEventsStore:
    """Base de datos de administración de eventos (se reemplaza en los tests)."""
    return get_database(get_settings())


def _eid(raw: str) -> int:
    """Id de la ruta; un valor que no es un entero positivo es un evento inexistente (404)."""
    parsed = parse_place_id(raw)
    if parsed is None:
        raise HTTPException(status_code=404, detail=service.NOT_FOUND)
    return parsed


def _saved(event: dict, rag_sync: str) -> EventSavedOut:
    return EventSavedOut(**event, rag_sync=rag_sync)  # type: ignore[arg-type]


def _matches(event: dict, needle: str) -> bool:
    haystack = [str(event["id"]), event["slug"], event["title"], event.get("organizer") or "", *event.get("keywords", [])]
    return any(needle in normalize_text(text) for text in haystack)


@router.get("", response_model=list[EventAdminOut], responses=_DB, summary="Todos los eventos (también ocultos y pasados)")
def list_events(
    place: int | None = Query(default=None, gt=0, description="Solo los eventos de este lugar (id)."),
    published: bool | None = Query(default=None, description="true = publicados, false = ocultos."),
    q: str | None = Query(default=None, max_length=200, description="Texto en título, organizador, palabras clave, slug o id."),
    _: str = Depends(get_current_admin),
    store: AdminEventsStore = Depends(get_admin_events_store),
) -> list[dict]:
    """Eventos del más reciente al más antiguo. Los filtros se combinan con «y»."""
    events = store.admin_list_events(place, published)
    needle = normalize_text(q) if q else ""
    return [e for e in events if _matches(e, needle)] if needle else events


@router.get(
    "/{event_id}",
    response_model=EventAdminOut,
    responses={**_DB, 404: {"description": "No existe."}},
    summary="Ficha completa de un evento",
)
def get_event(
    event_id: str,
    _: str = Depends(get_current_admin),
    store: AdminEventsStore = Depends(get_admin_events_store),
) -> dict:
    event = store.admin_get_event(_eid(event_id))
    if event is None:
        raise HTTPException(status_code=404, detail=service.NOT_FOUND)
    return event


@router.post(
    "",
    status_code=201,
    response_model=EventSavedOut,
    responses={**_DB, 422: {"description": "Datos no válidos; el error nombra el campo."}},
    summary="Crear un evento",
)
def create_event(
    body: EventIn,
    response: Response,
    admin: str = Depends(get_current_admin),
    store: AdminEventsStore = Depends(get_admin_events_store),
    sync: EventSync = Depends(get_event_sync),
) -> EventSavedOut:
    """El `id` y el `slug` los asigna el sistema. `rag_sync` indica si el asistente ya conoce el evento."""
    event = service.create_event(store, body, admin)
    response.headers["Location"] = f"/api/admin/events/{event['id']}"
    return _saved(event, safe_sync(sync, event["id"]))


@router.put(
    "/{event_id}",
    response_model=EventSavedOut,
    responses={**_DB, 404: {"description": "No existe."}, 422: {"description": "Datos no válidos."}},
    summary="Editar un evento (reemplazo completo)",
)
def update_event(
    event_id: str,
    body: EventIn,
    admin: str = Depends(get_current_admin),
    store: AdminEventsStore = Depends(get_admin_events_store),
    sync: EventSync = Depends(get_event_sync),
) -> EventSavedOut:
    """Reemplaza todos los campos editables: lo que no se envía queda vacío. Para despublicar
    se envía `is_published: false`."""
    eid = _eid(event_id)
    event = service.update_event(store, eid, body, admin)
    return _saved(event, safe_sync(sync, eid))


@router.delete(
    "/{event_id}",
    response_model=EventDeletedOut,
    responses={**_DB, 404: {"description": "No existe."}},
    summary="Borrar un evento",
)
def delete_event(
    event_id: str,
    admin: str = Depends(get_current_admin),
    store: AdminEventsStore = Depends(get_admin_events_store),
    sync: EventSync = Depends(get_event_sync),
) -> EventDeletedOut:
    """Borra el evento y su documento del asistente."""
    eid = _eid(event_id)
    result, detail = store.delete_event(eid)
    if result == "not_found":
        raise HTTPException(status_code=404, detail=service.NOT_FOUND)
    logger.info("evento borrado id=%s por=%s", eid, admin)
    return EventDeletedOut(rag_sync=safe_remove(sync, str(detail)))


@router.post(
    "/{event_id}/reindex",
    response_model=EventSavedOut,
    responses={**_DB, 404: {"description": "No existe."}},
    summary="Repetir la sincronización con el asistente",
)
def reindex_event(
    event_id: str,
    _: str = Depends(get_current_admin),
    store: AdminEventsStore = Depends(get_admin_events_store),
    sync: EventSync = Depends(get_event_sync),
) -> EventSavedOut:
    eid = _eid(event_id)
    event = store.admin_get_event(eid)
    if event is None:
        raise HTTPException(status_code=404, detail=service.NOT_FOUND)
    return _saved(event, safe_sync(sync, eid))
