"""Administración de lugares y categorías (HU-30). Requiere sesión de administrador.

Los lugares no se borran: se despublican con `is_published`. El `id` de un lugar
nuevo lo asigna el sistema (número incremental).
"""

from __future__ import annotations

import logging
from typing import Any, Protocol

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.auth.dependencies import get_current_admin
from app.config import get_settings
from app.places import service
from app.places.sync import PlaceSync, get_place_sync, safe_sync
from app.places.text import normalize_text
from app.rag.db import DuplicateError, get_database
from app.schemas.places_admin import (
    PlaceAdminOut,
    PlaceCategoryAdminOut,
    PlaceCategoryCreate,
    PlaceCategoryIn,
    PlaceIn,
    PlaceSavedOut,
)

logger = logging.getLogger(__name__)

_AUTH: dict[int | str, dict[str, Any]] = {401: {"description": "Falta la sesión de administrador o venció."}}
_DB: dict[int | str, dict[str, Any]] = {**_AUTH, 503: {"description": "La base de datos no responde."}}
_NOT_FOUND_PLACE = "Lugar no encontrado."
_NOT_FOUND_CATEGORY = "Categoría no encontrada."

places_router = APIRouter(
    prefix="/api/admin/places",
    tags=["admin-places"],
)
categories_router = APIRouter(
    prefix="/api/admin/place-categories",
    tags=["admin-place-categories"],
)


class AdminPlacesStore(Protocol):
    def admin_list_places(
        self, category_id: str | None = None, published: bool | None = None, verified: bool | None = None
    ) -> list[dict]: ...
    def admin_get_place(self, place_id: str) -> dict | None: ...
    def category_exists(self, category_id: str) -> bool: ...
    def place_exists(self, place_id: str) -> bool: ...
    def would_create_cycle(self, place_id: str, parent_id: str) -> bool: ...
    def create_place(self, data: dict, verified: bool, username: str) -> dict: ...
    def update_place(self, place_id: str, data: dict, verified: bool, username: str) -> dict | None: ...
    def admin_list_categories(self) -> list[dict]: ...
    def create_category(self, category_id: str, label: str, color: str, sort_order: int | None) -> dict: ...
    def update_category(self, category_id: str, label: str, color: str, sort_order: int | None) -> dict | None: ...
    def delete_category(self, category_id: str) -> tuple[str, int]: ...


def get_admin_places_store() -> AdminPlacesStore:
    """Base de datos de administración de lugares (se reemplaza en los tests)."""
    return get_database(get_settings())


def _saved(place: dict, rag_sync: str) -> PlaceSavedOut:
    return PlaceSavedOut(**place, rag_sync=rag_sync)  # type: ignore[arg-type]


def _matches(place: dict, needle: str) -> bool:
    haystack = [place["id"], place["name"], place.get("short_name") or "", *place.get("keywords", [])]
    return any(needle in normalize_text(text) for text in haystack)


@places_router.get(
    "", response_model=list[PlaceAdminOut], responses=_DB, summary="Todos los lugares (también los ocultos)"
)
def list_places(
    category: str | None = Query(default=None, max_length=64, description="Solo esta categoría."),
    published: bool | None = Query(default=None, description="true = publicados, false = ocultos."),
    verified: bool | None = Query(default=None, description="true = verificados, false = sin verificar."),
    q: str | None = Query(default=None, max_length=200, description="Texto en nombre, sigla, palabras clave o id."),
    _: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
) -> list[dict]:
    """Lugares por nombre, con `created_at` y `updated_by`. Los filtros se combinan con «y»."""
    places = store.admin_list_places(category or None, published, verified)
    needle = normalize_text(q) if q else ""
    return [p for p in places if _matches(p, needle)] if needle else places


@places_router.get(
    "/{place_id}",
    response_model=PlaceAdminOut,
    responses={**_DB, 404: {"description": "No existe."}},
    summary="Ficha completa de un lugar",
)
def get_place(
    place_id: str,
    _: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
) -> dict:
    place = store.admin_get_place(place_id)
    if place is None:
        raise HTTPException(status_code=404, detail=_NOT_FOUND_PLACE)
    return place


@places_router.post(
    "",
    status_code=201,
    response_model=PlaceSavedOut,
    responses={**_DB, 422: {"description": "Datos no válidos; el error nombra el campo."}},
    summary="Crear un lugar",
)
def create_place(
    body: PlaceIn,
    response: Response,
    admin: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
    sync: PlaceSync = Depends(get_place_sync),
) -> PlaceSavedOut:
    """El `id` lo asigna el sistema. `rag_sync` indica si el asistente ya conoce el lugar."""
    place = service.create_place(store, body, admin)
    response.headers["Location"] = f"/api/admin/places/{place['id']}"
    return _saved(place, safe_sync(sync, place["id"]))


@places_router.put(
    "/{place_id}",
    response_model=PlaceSavedOut,
    responses={**_DB, 404: {"description": "No existe."}, 422: {"description": "Datos no válidos."}},
    summary="Editar un lugar (reemplazo completo)",
)
def update_place(
    place_id: str,
    body: PlaceIn,
    admin: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
    sync: PlaceSync = Depends(get_place_sync),
) -> PlaceSavedOut:
    """Reemplaza todos los campos editables: lo que no se envía queda vacío. Para despublicar
    se envía `is_published: false`. `verified` fija o borra `verified_at`."""
    place = service.update_place(store, place_id, body, admin)
    return _saved(place, safe_sync(sync, place_id))


@places_router.post(
    "/{place_id}/reindex",
    response_model=PlaceSavedOut,
    responses={**_DB, 404: {"description": "No existe."}},
    summary="Repetir la sincronización con el asistente",
)
def reindex_place(
    place_id: str,
    _: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
    sync: PlaceSync = Depends(get_place_sync),
) -> PlaceSavedOut:
    place = store.admin_get_place(place_id)
    if place is None:
        raise HTTPException(status_code=404, detail=_NOT_FOUND_PLACE)
    return _saved(place, safe_sync(sync, place_id))


# --- categorías ---------------------------------------------------------------


@categories_router.get(
    "", response_model=list[PlaceCategoryAdminOut], responses=_DB, summary="Categorías con su cantidad de lugares"
)
def list_categories(
    _: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
) -> list[dict]:
    return store.admin_list_categories()


@categories_router.post(
    "",
    status_code=201,
    response_model=PlaceCategoryAdminOut,
    responses={**_DB, 409: {"description": "Ya existe una categoría con ese id."}},
    summary="Crear una categoría",
)
def create_category(
    body: PlaceCategoryCreate,
    response: Response,
    admin: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
) -> dict:
    try:
        category = store.create_category(body.id, body.label, body.color, body.sort_order)
    except DuplicateError:
        raise service.field_error("id", "Ya existe una categoría con ese id.", status=409) from None
    response.headers["Location"] = f"/api/admin/place-categories/{body.id}"
    logger.info("categoría creada id=%s por=%s", body.id, admin)
    return category


@categories_router.put(
    "/{category_id}",
    response_model=PlaceCategoryAdminOut,
    responses={**_DB, 404: {"description": "No existe."}},
    summary="Editar una categoría",
)
def update_category(
    category_id: str,
    body: PlaceCategoryIn,
    admin: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
) -> dict:
    category = store.update_category(category_id, body.label, body.color, body.sort_order)
    if category is None:
        raise HTTPException(status_code=404, detail=_NOT_FOUND_CATEGORY)
    logger.info("categoría editada id=%s por=%s", category_id, admin)
    return category


@categories_router.delete(
    "/{category_id}",
    status_code=204,
    responses={
        **_DB,
        404: {"description": "No existe."},
        409: {"description": "Tiene lugares (publicados o no)."},
    },
    summary="Borrar una categoría vacía",
)
def delete_category(
    category_id: str,
    admin: str = Depends(get_current_admin),
    store: AdminPlacesStore = Depends(get_admin_places_store),
) -> Response:
    result, count = store.delete_category(category_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail=_NOT_FOUND_CATEGORY)
    if result == "in_use":
        noun = "lugar" if count == 1 else "lugares"
        raise HTTPException(
            status_code=409, detail=f"No se puede borrar: la categoría tiene {count} {noun}."
        )
    logger.info("categoría borrada id=%s por=%s", category_id, admin)
    return Response(status_code=204)
