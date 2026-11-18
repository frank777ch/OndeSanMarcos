"""Esquemas de `/api/admin/events`."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.events.catalog import CATEGORIES, DEFAULT_CATEGORY, DEFAULT_MODALITY, DEFAULT_STATUS, MODALITIES, STATUSES
from app.events.timeutil import as_lima
from app.schemas.events import EventOut
from app.schemas.places_admin import _EMAIL, _clean_text, _http_url

_SHORT = 300
_LONG = 5000
_MAX_ITEMS = 50
_MAX_ITEM = 200

_SHORT_TEXTS = (
    "location_detail", "organizer", "status_note", "price_note", "audience", "registration_note",
    "phone", "email", "website", "image_url", "registration_url", "online_url",
)
_URLS = ("website", "image_url", "registration_url", "online_url")
_LISTS = ("agenda", "keywords")


class EventIn(BaseModel):
    """Datos editables de un evento. El `id` y el `slug` los asigna el sistema y no se aceptan."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=200, description="Título (obligatorio).")
    starts_at: datetime = Field(..., description="Inicio (obligatorio). Sin zona horaria se toma como hora de Lima.")
    ends_at: datetime | None = Field(default=None, description="Fin; no puede ser anterior al inicio.")
    place_id: int | None = Field(default=None, gt=0, description="Id del lugar donde ocurre; vacío si es virtual.")
    description: str | None = Field(default=None, description="Descripción (hasta 5000 caracteres).")
    image_url: str | None = Field(default=None, description="Dirección de la portada (http o https).")
    location_detail: str | None = Field(default=None, description="Sala o referencia dentro del lugar.")
    category: str = Field(default=DEFAULT_CATEGORY, description="Tipo de evento.")
    organizer: str | None = Field(default=None, description="Quién lo organiza.")
    status: str = Field(default=DEFAULT_STATUS, description="scheduled, cancelled o postponed.")
    status_note: str | None = Field(default=None, description="Aclaración del estado (motivo, nueva fecha).")
    is_free: bool | None = Field(default=None, description="true = gratis, false = con costo, vacío = no se indicó.")
    price_note: str | None = Field(default=None, description="Costo o aclaración del costo.")
    audience: str | None = Field(default=None, description="A quién va dirigido.")
    registration_url: str | None = Field(default=None, description="Enlace de inscripción (http o https).")
    registration_note: str | None = Field(default=None, description="Condiciones de la inscripción.")
    modality: str = Field(default=DEFAULT_MODALITY, description="in_person, online o hybrid.")
    online_url: str | None = Field(default=None, description="Enlace para verlo en línea (http o https).")
    agenda: list[str] = Field(default_factory=list, description="Programa; un tramo por elemento.")
    keywords: list[str] = Field(default_factory=list, description="Palabras con las que se busca.")
    website: str | None = Field(default=None, description="Más información (http o https).")
    email: str | None = Field(default=None, description="Correo de contacto.")
    phone: str | None = Field(default=None, description="Teléfono de contacto.")
    is_published: bool = Field(default=True, description="Si es visible en el mapa y para el asistente.")

    @field_validator(*_SHORT_TEXTS, mode="before")
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

    @field_validator(*_URLS)
    @classmethod
    def _url(cls, value: str | None) -> str | None:
        return None if value is None else _http_url(value)

    @field_validator("category")
    @classmethod
    def _category(cls, value: str) -> str:
        if value not in CATEGORIES:
            raise ValueError("Elige un tipo de la lista.")
        return value

    @field_validator("status")
    @classmethod
    def _status(cls, value: str) -> str:
        if value not in STATUSES:
            raise ValueError("Elige un estado de la lista.")
        return value

    @field_validator("modality")
    @classmethod
    def _modality(cls, value: str) -> str:
        if value not in MODALITIES:
            raise ValueError("Elige una modalidad de la lista.")
        return value

    @field_validator("starts_at", "ends_at")
    @classmethod
    def _lima(cls, value: datetime | None) -> datetime | None:
        # Una fecha sin zona horaria se interpreta como hora de Lima, no como UTC.
        return None if value is None else as_lima(value)

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


class EventAdminOut(EventOut):
    """Evento completo para el administrador, publicado o no."""

    keywords: list[str] = Field(default_factory=list)
    is_published: bool = Field(..., description="Si es visible en el mapa y para el asistente.")
    created_at: datetime = Field(..., description="Cuándo se creó.")
    updated_at: datetime = Field(..., description="Último cambio.")
    updated_by: str | None = Field(default=None, description="Administrador que hizo el último cambio.")


class EventSavedOut(EventAdminOut):
    rag_sync: Literal["ok", "skipped", "failed"] = Field(
        ...,
        description="Estado de la sincronización con el asistente: ok, skipped (modo de prueba) o "
        "failed (el cambio se guardó; se puede repetir con /reindex).",
    )


class EventDeletedOut(BaseModel):
    rag_sync: Literal["ok", "skipped", "failed"] = Field(
        ..., description="Si el evento ya se quitó del asistente (ok, skipped o failed)."
    )
