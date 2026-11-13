"""Área en la que se aceptan coordenadas de lugares (HU-30).

Es el recuadro del campus de la web más su margen: fuera de él el mapa no deja
navegar, así que un lugar ahí no se podría ver. Debe mantenerse alineada con
`web/src/features/map/constants/campus.ts` (`CAMPUS.bounds` y `CAMPUS.margin`).
Y con `web/src/features/admin/places/utils/bounds.ts`.
"""

from __future__ import annotations

_SW_LNG, _SW_LAT = -77.09, -12.064
_NE_LNG, _NE_LAT = -77.075, -12.049
_MARGIN = 0.006

MIN_LAT = _SW_LAT - _MARGIN
MAX_LAT = _NE_LAT + _MARGIN
MIN_LNG = _SW_LNG - _MARGIN
MAX_LNG = _NE_LNG + _MARGIN


def in_campus(lat: float, lng: float) -> bool:
    return MIN_LAT <= lat <= MAX_LAT and MIN_LNG <= lng <= MAX_LNG
