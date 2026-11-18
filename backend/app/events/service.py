"""Reglas de escritura de eventos que dependen de la base."""

from __future__ import annotations

import logging
from typing import Protocol

from fastapi import HTTPException

from app.places.service import field_error
from app.schemas.events_admin import EventIn

logger = logging.getLogger(__name__)

NOT_FOUND = "Evento no encontrado."


class EventWriter(Protocol):
    def place_exists(self, place_id: int) -> bool: ...
    def event_exists(self, event_id: int) -> bool: ...
    def create_event(self, data: dict, username: str) -> dict: ...
    def update_event(self, event_id: int, data: dict, username: str) -> dict | None: ...


def _check(db: EventWriter, body: EventIn) -> None:
    if body.ends_at is not None and body.ends_at < body.starts_at:
        raise field_error("ends_at", "El fin no puede ser anterior al inicio.")
    if body.place_id is not None and not db.place_exists(body.place_id):
        raise field_error("place_id", "El lugar no existe.")


def create_event(db: EventWriter, body: EventIn, username: str) -> dict:
    _check(db, body)
    event = db.create_event(body.model_dump(), username)
    logger.info("evento creado id=%s por=%s", event["id"], username)
    return event


def update_event(db: EventWriter, event_id: int, body: EventIn, username: str) -> dict:
    if not db.event_exists(event_id):
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    _check(db, body)
    event = db.update_event(event_id, body.model_dump(), username)
    if event is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    logger.info("evento editado id=%s por=%s publicado=%s", event_id, username, event["is_published"])
    return event
