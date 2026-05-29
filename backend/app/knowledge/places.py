"""Lugares del campus de la UNMSM.

Espejo en el backend del dataset del frontend
(`src/features/map/constants/unmsm.ts` → `CAMPUS_PLACES`). Mantener ambos
alineados: el frontend usa estos `id` para centrar el mapa ("Ver en mapa").
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class Coordinate:
    """Coordenada geográfica."""

    latitude: float
    longitude: float


@dataclass(frozen=True)
class CampusPlace:
    """Lugar del campus con metadatos para búsqueda y mapa."""

    id: str
    name: str
    schedule: str
    keywords: tuple[str, ...]
    coordinate: Coordinate


CAMPUS_PLACES: list[CampusPlace] = [
    CampusPlace(
        id="rectorado",
        name="Rectorado",
        schedule="Lun–Vie 8:00–17:00",
        keywords=("rectorado", "rector", "administracion central"),
        coordinate=Coordinate(-12.0578, -77.084),
    ),
    CampusPlace(
        id="comedor-universitario",
        name="Comedor Universitario",
        schedule="Lun–Vie 12:00–14:30",
        keywords=("comedor", "comedor universitario", "almuerzo"),
        coordinate=Coordinate(-12.056, -77.081),
    ),
    CampusPlace(
        id="auditorio-ela-dunbar-temple",
        name="Auditorio Ela Dunbar Temple",
        schedule="Según programación de eventos",
        keywords=("auditorio", "ela dunbar", "dunbar temple", "ela dunbar temple"),
        coordinate=Coordinate(-12.059, -77.0825),
    ),
    CampusPlace(
        id="biblioteca-central",
        name="Biblioteca Central Pedro Zulen",
        schedule="Lun–Sáb 8:00–21:00",
        keywords=("biblioteca", "biblioteca central", "pedro zulen", "libros"),
        coordinate=Coordinate(-12.0568, -77.0838),
    ),
    CampusPlace(
        id="fisi",
        name="Facultad de Ingeniería de Sistemas (FISI)",
        schedule="Lun–Vie 7:00–22:00",
        keywords=("fisi", "sistemas", "ingenieria de sistemas", "software"),
        coordinate=Coordinate(-12.054, -77.085),
    ),
    CampusPlace(
        id="estadio",
        name="Estadio Universitario",
        schedule="Lun–Dom 6:00–20:00",
        keywords=("estadio", "cancha", "deporte", "futbol"),
        coordinate=Coordinate(-12.06, -77.08),
    ),
    CampusPlace(
        id="museo-historia-natural",
        name="Museo de Historia Natural",
        schedule="Mar–Dom 9:00–15:00",
        keywords=("museo", "historia natural", "museo de historia"),
        coordinate=Coordinate(-12.0552, -77.0805),
    ),
]

_PLACES_BY_ID: dict[str, CampusPlace] = {place.id: place for place in CAMPUS_PLACES}


def normalize(text: str) -> str:
    """Minúsculas y sin tildes, para emparejar consultas de forma robusta."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def get_place_by_id(place_id: str) -> CampusPlace | None:
    """Devuelve el lugar con ese id, o None si no existe."""
    return _PLACES_BY_ID.get(place_id)


def find_places(query: str) -> list[CampusPlace]:
    """Lugares cuyas palabras clave aparecen en la consulta (sin tildes)."""
    normalized_query = normalize(query)
    return [
        place
        for place in CAMPUS_PLACES
        if any(normalize(keyword) in normalized_query for keyword in place.keywords)
    ]
