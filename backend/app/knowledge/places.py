"""Tipos de un lugar del campus para el motor del asistente.

Los lugares ya no viven aquí: la fuente es la tabla `places` (semilla inicial en
`db/seed/places.json`), y `app/places/directory.py` los entrega al motor (HU-29).
Este módulo conserva solo `CampusPlace`, `Coordinate` y `normalize`, que usan el motor, los
guardrails y la detección de intención.
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
    """Lugar del campus con metadatos para búsqueda y mapa.

    `id` es el slug del lugar en la tabla `places`; `schedule` vale `""` si no tiene horario.
    """

    id: str
    name: str
    schedule: str
    keywords: tuple[str, ...]
    coordinate: Coordinate


def normalize(text: str) -> str:
    """Minúsculas y sin tildes, para emparejar consultas de forma robusta."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
