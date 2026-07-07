"""Generador del dataset de lugares del campus a partir de Google Places.

Dos entradas de línea de comandos:

* ``fetch_places``    -> consulta la Places API (New) y vuelca el JSON crudo.
* ``build_unmsm_ts``  -> mapea ese JSON al shape ``CampusPlace[]`` del frontend.

La lógica pura (slugs, mapeo, keywords, serialización TS) vive en ``mapping`` y
es testeable sin red. Ver ``README.md`` para uso y advertencias (ToS de Google,
centroide != entrada peatonal, cobertura).
"""

from app.tools.maps.mapping import (
    CAMPUS_BOUNDS,
    CampusPlace,
    Coordinate,
    assign_unique_ids,
    map_raw_place,
    map_raw_places,
    render_ts,
    slugify,
)

__all__ = [
    "CAMPUS_BOUNDS",
    "CampusPlace",
    "Coordinate",
    "assign_unique_ids",
    "map_raw_place",
    "map_raw_places",
    "render_ts",
    "slugify",
]
