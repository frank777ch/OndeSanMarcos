"""Esquema público de `/api/events` (los eventos próximos que ve el mapa)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class EventOut(BaseModel):
    id: int = Field(..., description="Id numérico del evento.")
    slug: str = Field(..., description="Nombre estandarizado, estable y único.")
    title: str
    description: str | None = None
    image_url: str | None = Field(default=None, description="Portada del evento.")
    starts_at: datetime = Field(..., description="Inicio (con zona horaria; el campus usa hora de Lima, UTC-5).")
    ends_at: datetime | None = Field(default=None, description="Fin; vacío si no se indicó.")
    place_id: int | None = Field(default=None, description="Id del lugar donde ocurre; vacío si es virtual.")
    location_detail: str | None = Field(default=None, description="Sala o referencia dentro del lugar.")
    category: str = Field(..., description="academico, cultural, deportivo, feria, charla, taller, institucional u otro.")
    organizer: str | None = None
    status: str = Field(..., description="scheduled, cancelled o postponed.")
    status_note: str | None = None
    is_free: bool | None = Field(default=None, description="true = gratis, false = con costo, vacío = no se indicó.")
    price_note: str | None = None
    audience: str | None = None
    registration_url: str | None = None
    registration_note: str | None = None
    modality: str = Field(..., description="in_person, online o hybrid.")
    online_url: str | None = None
    agenda: list[str] = Field(default_factory=list, description="Programa; un tramo por elemento.")
    website: str | None = None
    email: str | None = None
    phone: str | None = None
