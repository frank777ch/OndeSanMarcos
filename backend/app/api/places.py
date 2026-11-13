"""Lugares del campus, de solo lectura y sin autenticación (HU-27).

- `GET /api/place-categories`
- `GET /api/places[?category=<id numérico>]`
- `GET /api/places/{id}` (id numérico)

Solo salen lugares publicados. Un lugar inexistente, oculto o con un id que no es
un slug responde el mismo 404 (no se revela que existe uno oculto). Las
respuestas llevan `Cache-Control` y `ETag` (ver `app.api.caching`).
"""

from __future__ import annotations

from typing import Any, Protocol

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import TypeAdapter

from app.api.caching import cached_json
from app.config import get_settings
from app.places.text import parse_place_id
from app.rag.db import get_database
from app.schemas.places import PlaceCategoryOut, PlaceOut

router = APIRouter(prefix="/api", tags=["places"])

_NOT_FOUND = "Lugar no encontrado."

_CATEGORIES = TypeAdapter(list[PlaceCategoryOut])
_PLACES = TypeAdapter(list[PlaceOut])
_PLACE = TypeAdapter(PlaceOut)

_CACHE_HEADERS: dict[str, Any] = {
    "Cache-Control": {"description": "public, max-age=60", "schema": {"type": "string"}},
    "ETag": {"description": "Hash del contenido, para If-None-Match.", "schema": {"type": "string"}},
}
_NOT_MODIFIED: dict[int | str, dict[str, Any]] = {
    304: {"description": "El contenido no cambió (If-None-Match coincide).", "headers": _CACHE_HEADERS},
    503: {"description": "La base de datos no responde."},
}


class PlacesStore(Protocol):
    def list_place_categories(self) -> list[dict]: ...
    def list_places(self, category_id: int | None = None) -> list[dict]: ...
    def get_place(self, place_id: int) -> dict | None: ...
    def search_places(self, query: str, limit: int = 8) -> list[dict]: ...


def get_places_store() -> PlacesStore:
    """Base de datos de lugares (se reemplaza en los tests)."""
    return get_database(get_settings())


@router.get(
    "/place-categories",
    response_model=list[PlaceCategoryOut],
    responses=_NOT_MODIFIED,
    summary="Categorías de lugares",
)
def list_categories(request: Request, store: PlacesStore = Depends(get_places_store)) -> Response:
    """Categorías ordenadas por `sort_order`. Pública y cacheable 60 s."""
    return cached_json(request, _CATEGORIES, store.list_place_categories())


@router.get(
    "/places",
    response_model=list[PlaceOut],
    responses=_NOT_MODIFIED,
    summary="Lugares del campus",
)
def list_places(
    request: Request,
    category: int | None = Query(
        default=None,
        gt=0,
        description="Solo los lugares de esta categoría. Una categoría inexistente da lista vacía.",
    ),
    store: PlacesStore = Depends(get_places_store),
) -> Response:
    """Lugares publicados, ordenados por nombre. Pública y cacheable 60 s."""
    return cached_json(request, _PLACES, store.list_places(category))


@router.get(
    "/places/search",
    response_model=list[PlaceOut],
    responses=_NOT_MODIFIED,
    summary="Buscar lugares por nombre, sigla o palabra clave",
)
def search_places(
    request: Request,
    q: str = Query(
        ...,
        max_length=100,
        description="Texto a buscar (2 a 100 caracteres). Ignora tildes y mayúsculas y tolera errores "
        "de escritura. Con menos de 2 caracteres la lista es vacía.",
    ),
    limit: int = Query(default=8, ge=1, le=20, description="Máximo de resultados."),
    store: PlacesStore = Depends(get_places_store),
) -> Response:
    """Lugares publicados que coinciden con `q`, del más al menos parecido. Pública y cacheable 60 s.

    Declarada antes de `/places/{place_id}` para que `search` no se tome por un id.
    """
    text = q.strip()
    return cached_json(request, _PLACES, store.search_places(text, limit) if len(text) >= 2 else [])


@router.get(
    "/places/{place_id}",
    response_model=PlaceOut,
    responses={**_NOT_MODIFIED, 404: {"description": "El lugar no existe o no está publicado."}},
    summary="Ficha de un lugar",
)
def get_place(
    place_id: str, request: Request, store: PlacesStore = Depends(get_places_store)
) -> Response:
    """Un lugar publicado. Inexistente, oculto o id inválido: el mismo 404."""
    parsed = parse_place_id(place_id)
    place = store.get_place(parsed) if parsed is not None else None
    if place is None:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    return cached_json(request, _PLACE, place)
