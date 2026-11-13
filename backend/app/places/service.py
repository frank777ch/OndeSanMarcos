"""Reglas de escritura de lugares que dependen de la base (HU-30)."""

from __future__ import annotations

import logging
from typing import Any, Protocol

from fastapi import HTTPException

from app.schemas.places_admin import PlaceIn

logger = logging.getLogger(__name__)


class PlaceWriter(Protocol):
    def category_exists(self, category_id: str) -> bool: ...
    def place_exists(self, place_id: str) -> bool: ...
    def would_create_cycle(self, place_id: str, parent_id: str) -> bool: ...
    def create_place(self, data: dict, verified: bool, username: str) -> dict: ...
    def update_place(self, place_id: str, data: dict, verified: bool, username: str) -> dict | None: ...


def field_error(field: str, message: str, status: int = 422) -> HTTPException:
    """Error con el mismo formato que los de validación de FastAPI."""
    return HTTPException(
        status_code=status,
        detail=[{"loc": ["body", field], "msg": message, "type": "value_error"}],
    )


def _check_references(db: PlaceWriter, body: PlaceIn, place_id: str | None) -> None:
    if not db.category_exists(body.category_id):
        raise field_error("category_id", "La categoría no existe.")
    parent = body.parent_place_id
    if parent is None:
        return
    if place_id is not None and parent == place_id:
        raise field_error("parent_place_id", "Un lugar no puede contenerse a sí mismo.")
    if not db.place_exists(parent):
        raise field_error("parent_place_id", "El lugar contenedor no existe.")
    if place_id is not None and db.would_create_cycle(place_id, parent):
        raise field_error("parent_place_id", "Formaría un ciclo de lugares contenedores.")


def _data(body: PlaceIn) -> dict[str, Any]:
    return body.model_dump(exclude={"verified"})


def create_place(db: PlaceWriter, body: PlaceIn, username: str) -> dict:
    _check_references(db, body, None)
    place = db.create_place(_data(body), body.verified, username)
    logger.info("lugar creado id=%s por=%s", place["id"], username)
    return place


def update_place(db: PlaceWriter, place_id: str, body: PlaceIn, username: str) -> dict:
    if not db.place_exists(place_id):
        raise HTTPException(status_code=404, detail="Lugar no encontrado.")
    _check_references(db, body, place_id)
    place = db.update_place(place_id, _data(body), body.verified, username)
    if place is None:
        raise HTTPException(status_code=404, detail="Lugar no encontrado.")
    logger.info("lugar editado id=%s por=%s publicado=%s", place_id, username, place["is_published"])
    return place
