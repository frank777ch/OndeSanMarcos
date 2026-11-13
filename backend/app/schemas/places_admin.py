"""Esquemas de `/api/admin/places` y `/api/admin/place-categories` (HU-30)."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.places.area import MAX_LAT, MAX_LNG, MIN_LAT, MIN_LNG
from app.schemas.places import PlaceOut

_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
_SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

_SHORT = 300
_LONG = 5000
_MAX_ITEMS = 50
_MAX_ITEM = 200

_SHORT_TEXTS = (
    "short_name", "schedule", "phone", "annex", "email", "website", "access_hint", "usage", "image_url",
)
_LISTS = ("keywords", "detailed_schedule", "careers", "services")


def _clean_text(value: object, limit: int) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("Debe ser texto.")
    value = value.strip()
    if not value:
        return None
    if len(value) > limit:
        raise ValueError(f"Máximo {limit} caracteres.")
    return value


def _http_url(value: str) -> str:
    parts = urlparse(value)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise ValueError("Debe ser una dirección http o https.")
    return value


class PlaceIn(BaseModel):
    """Datos editables de un lugar. El `id` lo asigna el sistema y no se acepta."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=200, description="Nombre completo (obligatorio).")
    category_id: str = Field(..., min_length=1, max_length=64, description="Categoría existente (obligatorio).")
    lat: float = Field(..., description="Latitud; dentro del área del campus (obligatorio).")
    lng: float = Field(..., description="Longitud; dentro del área del campus (obligatorio).")
    short_name: str | None = Field(default=None, description="Nombre corto o sigla.")
    keywords: list[str] = Field(default_factory=list, description="Palabras con las que se busca.")
    description: str | None = Field(default=None, description="Descripción (hasta 5000 caracteres).")
    schedule: str | None = Field(default=None, description="Horario resumido.")
    detailed_schedule: list[str] = Field(default_factory=list, description="Un tramo de horario por elemento.")
    phone: str | None = Field(default=None, description="Teléfono.")
    annex: str | None = Field(default=None, description="Anexo telefónico.")
    email: str | None = Field(default=None, description="Correo de contacto.")
    website: str | None = Field(default=None, description="Página web (http o https).")
    access_hint: str | None = Field(default=None, description="Cómo encontrarlo o llegar.")
    careers: list[str] = Field(default_factory=list, description="Carreras (facultades).")
    services: list[str] = Field(default_factory=list, description="Servicios que ofrece.")
    usage: str | None = Field(default=None, description="Para qué se usa.")
    image_url: str | None = Field(default=None, description="Dirección de una imagen (http o https).")
    parent_place_id: str | None = Field(default=None, description="Lugar que lo contiene.")
    is_published: bool = Field(default=True, description="Si es visible en el mapa y para el asistente.")
    verified: bool = Field(default=False, description="Si el dato está confirmado (fija `verified_at`).")

    @field_validator(*_SHORT_TEXTS, "parent_place_id", mode="before")
    @classmethod
    def _short_text(cls, value: object) -> str | None:
        return _clean_text(value, _SHORT)

    @field_validator("description", mode="before")
    @classmethod
    def _long_text(cls, value: object) -> str | None:
        return _clean_text(value, _LONG)

    @field_validator("email")
    @classmethod
    def _email(cls, value: str | None) -> str | None:
        if value is not None and not _EMAIL.match(value):
            raise ValueError("Debe ser un correo válido.")
        return value

    @field_validator("website", "image_url")
    @classmethod
    def _url(cls, value: str | None) -> str | None:
        return None if value is None else _http_url(value)

    @field_validator(*_LISTS, mode="before")
    @classmethod
    def _list(cls, value: object) -> list[str]:
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("Debe ser una lista.")
        items: list[str] = []
        seen: set[str] = set()
        for raw in value:
            item = _clean_text(raw, _MAX_ITEM)
            if item is None:
                continue
            key = item.casefold()
            if key in seen:
                continue
            seen.add(key)
            items.append(item)
        if len(items) > _MAX_ITEMS:
            raise ValueError(f"Máximo {_MAX_ITEMS} elementos.")
        return items

    @field_validator("lat")
    @classmethod
    def _lat(cls, value: float) -> float:
        if not MIN_LAT <= value <= MAX_LAT:
            raise ValueError("Fuera del área del campus.")
        return value

    @field_validator("lng")
    @classmethod
    def _lng(cls, value: float) -> float:
        if not MIN_LNG <= value <= MAX_LNG:
            raise ValueError("Fuera del área del campus.")
        return value


class PlaceAdminOut(PlaceOut):
    """Lugar completo para el administrador, publicado o no."""

    is_published: bool = Field(..., description="Si es visible en el mapa y para el asistente.")
    created_at: datetime = Field(..., description="Cuándo se creó.")
    updated_by: str | None = Field(default=None, description="Administrador que hizo el último cambio.")


class PlaceSavedOut(PlaceAdminOut):
    rag_sync: Literal["ok", "skipped", "failed"] = Field(
        ...,
        description="Estado de la sincronización con el asistente: ok, skipped (modo de prueba) o "
        "failed (el cambio se guardó; se puede repetir con /reindex).",
    )


class PlaceCategoryIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    label: str = Field(..., min_length=1, max_length=100, description="Nombre legible.")
    color: str = Field(..., description="Color '#RRGGBB'.")
    sort_order: int | None = Field(default=None, ge=0, le=10000, description="Posición; por defecto, al final.")

    @field_validator("color")
    @classmethod
    def _color(cls, value: str) -> str:
        if not _COLOR.match(value):
            raise ValueError("Debe tener el formato #RRGGBB.")
        return value


class PlaceCategoryCreate(PlaceCategoryIn):
    id: str = Field(..., min_length=1, max_length=64, description="Slug estable, ej. 'laboratorios'.")

    @field_validator("id")
    @classmethod
    def _id(cls, value: str) -> str:
        if not _SLUG.match(value):
            raise ValueError("Solo minúsculas, dígitos y guiones.")
        return value


class PlaceCategoryAdminOut(BaseModel):
    id: str
    label: str
    color: str
    sort_order: int
    places_count: int = Field(..., description="Lugares de la categoría, publicados o no.")
