"""Esquemas de `/api/places` y `/api/place-categories` (HU-27).

Solo datos públicos: no existen `created_at` ni `updated_by`, así que no pueden
filtrarse en la respuesta.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PlaceCategoryOut(BaseModel):
    """Categoría de lugares (filtro y color del punto en el mapa)."""

    id: str = Field(..., description="Identificador estable, ej. 'facultades'.")
    label: str = Field(..., description="Nombre legible, ej. 'Facultades'.")
    color: str = Field(..., description="Color del punto en el mapa, '#RRGGBB'.")


class PlaceOut(BaseModel):
    """Lugar del campus con todos los datos de su ficha."""

    id: str = Field(..., description="Slug estable del lugar, ej. 'fisi'.")
    name: str = Field(..., description="Nombre completo.")
    short_name: str | None = Field(default=None, description="Nombre corto o sigla.")
    category_id: str = Field(..., description="Categoría (ver /api/place-categories).")
    lat: float = Field(..., description="Latitud en grados decimales.")
    lng: float = Field(..., description="Longitud en grados decimales.")
    keywords: list[str] = Field(
        default_factory=list, description="Palabras o siglas con las que se busca el lugar."
    )
    description: str | None = Field(default=None, description="Descripción del lugar.")
    schedule: str | None = Field(default=None, description="Horario resumido.")
    detailed_schedule: list[str] = Field(
        default_factory=list, description="Un tramo de horario por elemento."
    )
    phone: str | None = Field(default=None, description="Teléfono.")
    annex: str | None = Field(default=None, description="Anexo telefónico.")
    email: str | None = Field(default=None, description="Correo de contacto.")
    website: str | None = Field(default=None, description="Página web.")
    access_hint: str | None = Field(default=None, description="Cómo llegar o puerta más cercana.")
    careers: list[str] = Field(default_factory=list, description="Carreras (facultades).")
    services: list[str] = Field(default_factory=list, description="Servicios que ofrece.")
    usage: str | None = Field(default=None, description="Para qué se usa (auditorios).")
    image_url: str | None = Field(default=None, description="Imagen del lugar.")
    parent_place_id: str | None = Field(
        default=None, description="Lugar que lo contiene (un auditorio dentro de una facultad)."
    )
    is_published: bool = Field(..., description="Siempre verdadero en la API pública.")
    verified_at: datetime | None = Field(
        default=None, description="Cuándo se confirmó el dato con la universidad; vacío = sin verificar."
    )
    updated_at: datetime = Field(..., description="Última modificación.")
