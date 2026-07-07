"""Lógica pura del generador: slugs, mapeo raw -> CampusPlace, keywords y TS.

Sin red y sin efectos secundarios: todo lo que aquí vive se puede testear con
datos sintéticos. Los scripts de CLI (`fetch_places`, `build_unmsm_ts`) sólo
orquestan estas funciones con I/O real.

Fuentes de campo (Places API New -> CampusPlace):

    displayName.text            -> name        (y base del id/slug)
    location.{lat,lng}          -> coordinate  (CENTROIDE, no la entrada peatonal)
    editorialSummary.text       -> description
    nationalPhoneNumber
        / internationalPhoneNumber -> phone
    regularOpeningHours
        .weekdayDescriptions    -> detailedSchedule + schedule (compacto)
    displayName + types         -> keywords    (sin tildes, tokenizado)

Campos del interface que Places NO puede rellenar y quedan vacíos:
    annex, careers, usage, services, entranceCoordinate.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any

# Geo del campus (de la curada `unmsm.ts`). Rectángulo para restringir la
# búsqueda de Places y, de paso, descartar POIs que caigan fuera del recinto.
CAMPUS_BOUNDS = {
    "ne": {"latitude": -12.049, "longitude": -77.075},
    "sw": {"latitude": -12.064, "longitude": -77.09},
}

# Tokens de ruido que no aportan como keyword (artículos, preposiciones y
# términos genéricos de tipo POI). Se comparan ya normalizados (sin tildes).
_STOPWORDS = frozenset(
    {
        "de",
        "del",
        "la",
        "las",
        "el",
        "los",
        "y",
        "e",
        "o",
        "u",
        "en",
        "a",
        "al",
        "para",
        "por",
        "con",
        "point",
        "of",
        "interest",
        "establishment",
        "premise",
        "place",
    }
)


@dataclass(frozen=True)
class Coordinate:
    """Coordenada geográfica (mismo shape que el `Coordinate` del frontend)."""

    latitude: float
    longitude: float


@dataclass
class CampusPlace:
    """Espejo en Python del `CampusPlace` de `unmsm.ts` (sólo lo que mapeamos).

    Los campos opcionales que Places no provee se dejan en su valor vacío y no
    se emiten al serializar a TS.
    """

    id: str
    name: str
    coordinate: Coordinate
    schedule: str = ""
    keywords: list[str] = field(default_factory=list)
    description: str = ""
    phone: str = ""
    detailed_schedule: list[str] = field(default_factory=list)
    # No rellenables desde Places, se conservan por completitud del shape:
    annex: str = ""
    careers: list[str] = field(default_factory=list)
    usage: str = ""
    services: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Normalización y slugs.
# --------------------------------------------------------------------------- #
def normalize(text: str) -> str:
    """Minúsculas y sin tildes (NFD + descarte de marcas), para emparejar."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def slugify(text: str) -> str:
    """Convierte un nombre en un slug estable: sin tildes, `a-z0-9` y guiones."""
    ascii_text = normalize(text)
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-")
    return slug or "lugar"


def assign_unique_ids(names: list[str]) -> list[str]:
    """Slugs únicos y estables para `names`, en orden.

    Ante colisiones añade un sufijo `-2`, `-3`, ... al segundo y siguientes,
    de modo que el primero conserva el slug limpio y el resultado es
    determinista respecto al orden de entrada.
    """
    seen: dict[str, int] = {}
    ids: list[str] = []
    for name in names:
        base = slugify(name)
        count = seen.get(base, 0) + 1
        seen[base] = count
        ids.append(base if count == 1 else f"{base}-{count}")
    return ids


# --------------------------------------------------------------------------- #
# Keywords.
# --------------------------------------------------------------------------- #
def derive_keywords(name: str, types: list[str]) -> list[str]:
    """Keywords sin tildes a partir del nombre y los `types` de Places.

    Incluye: el nombre completo normalizado, cada token >=3 chars del nombre
    (sin stopwords) y cada `type` legible (`_` -> espacio). Sin duplicados y en
    orden de aparición.
    """
    keywords: list[str] = []

    def _add(term: str) -> None:
        term = term.strip()
        if term and term not in keywords:
            keywords.append(term)

    full = normalize(name).strip()
    _add(full)

    for token in re.split(r"[^a-z0-9]+", full):
        if len(token) >= 3 and token not in _STOPWORDS:
            _add(token)

    for raw_type in types:
        readable = normalize(raw_type.replace("_", " ")).strip()
        # Descarta tipos genéricos cuyos tokens son todos ruido (p. ej.
        # "point of interest", "establishment"); conserva los informativos.
        tokens = [t for t in re.split(r"[^a-z0-9]+", readable) if t]
        if tokens and any(t not in _STOPWORDS for t in tokens):
            _add(" ".join(tokens))

    return keywords


# --------------------------------------------------------------------------- #
# Horarios.
# --------------------------------------------------------------------------- #
def _extract_hours(place: dict[str, Any]) -> list[str]:
    """`weekdayDescriptions` de `regularOpeningHours`/`currentOpeningHours`."""
    for key in ("regularOpeningHours", "currentOpeningHours"):
        hours = place.get(key)
        if isinstance(hours, dict):
            descriptions = hours.get("weekdayDescriptions")
            if isinstance(descriptions, list) and descriptions:
                return [str(d) for d in descriptions]
    return []


def _within_bounds(lat: float, lng: float) -> bool:
    """¿Cae la coordenada dentro del rectángulo del campus?"""
    sw, ne = CAMPUS_BOUNDS["sw"], CAMPUS_BOUNDS["ne"]
    return (
        min(sw["latitude"], ne["latitude"]) <= lat <= max(sw["latitude"], ne["latitude"])
        and min(sw["longitude"], ne["longitude"])
        <= lng
        <= max(sw["longitude"], ne["longitude"])
    )


# --------------------------------------------------------------------------- #
# Mapeo raw -> CampusPlace.
# --------------------------------------------------------------------------- #
def map_raw_place(place: dict[str, Any], place_id: str) -> CampusPlace:
    """Mapea un objeto crudo de Places (New) a `CampusPlace` con `place_id` dado.

    `place_id` se calcula fuera (ver `map_raw_places`) para garantizar unicidad
    global entre todos los lugares.
    """
    name = str((place.get("displayName") or {}).get("text", "")).strip()

    location = place.get("location") or {}
    coordinate = Coordinate(
        latitude=float(location.get("latitude", 0.0)),
        longitude=float(location.get("longitude", 0.0)),
    )

    description = str((place.get("editorialSummary") or {}).get("text", "")).strip()

    phone = str(
        place.get("nationalPhoneNumber")
        or place.get("internationalPhoneNumber")
        or ""
    ).strip()

    detailed = _extract_hours(place)
    # `schedule` es la versión compacta de una línea; el detalle por día va en
    # `detailedSchedule`. Si no hay horario, queda "".
    schedule = " · ".join(detailed)

    types = [str(t) for t in (place.get("types") or [])]

    return CampusPlace(
        id=place_id,
        name=name,
        coordinate=coordinate,
        schedule=schedule,
        keywords=derive_keywords(name, types),
        description=description,
        phone=phone,
        detailed_schedule=detailed,
    )


def map_raw_places(
    places: list[dict[str, Any]], *, restrict_to_bounds: bool = True
) -> list[CampusPlace]:
    """Mapea una lista de lugares crudos a `CampusPlace`, con ids únicos.

    Descarta los que no tienen nombre. Si `restrict_to_bounds`, descarta los que
    caen fuera del rectángulo del campus (Places puede devolver vecinos).
    """
    kept: list[dict[str, Any]] = []
    for place in places:
        name = str((place.get("displayName") or {}).get("text", "")).strip()
        if not name:
            continue
        if restrict_to_bounds:
            location = place.get("location") or {}
            lat = location.get("latitude")
            lng = location.get("longitude")
            if lat is None or lng is None or not _within_bounds(float(lat), float(lng)):
                continue
        kept.append(place)

    ids = assign_unique_ids(
        [str((p.get("displayName") or {}).get("text", "")) for p in kept]
    )
    return [map_raw_place(place, place_id) for place, place_id in zip(kept, ids)]


# --------------------------------------------------------------------------- #
# Serialización a TypeScript.
# --------------------------------------------------------------------------- #
def _ts_string(value: str) -> str:
    """String TS con comillas dobles y escapes seguros (usa el escaper de JSON)."""
    return json.dumps(value, ensure_ascii=False)


def _ts_string_array(values: list[str], indent: str) -> str:
    """Array TS de strings; en una línea si es corto, si no multi-línea."""
    if not values:
        return "[]"
    items = [_ts_string(v) for v in values]
    one_line = "[" + ", ".join(items) + "]"
    if len(one_line) <= 76:
        return one_line
    inner = f",\n{indent}  ".join(items)
    return f"[\n{indent}  {inner},\n{indent}]"


def _ts_number(value: float) -> str:
    """Número TS con round-trip mínimo (repr de Python da la forma más corta)."""
    return repr(float(value))


def _render_place(place: CampusPlace) -> str:
    """Bloque TS `{ ... }` de un lugar; omite opcionales vacíos."""
    ind = "    "  # 4 espacios: elementos del array a 1 nivel de indentación.
    lines = [f"{ind}{{"]
    lines.append(f'{ind}  id: {_ts_string(place.id)},')
    lines.append(f"{ind}  name: {_ts_string(place.name)},")
    lines.append(f"{ind}  schedule: {_ts_string(place.schedule)},")
    lines.append(f"{ind}  keywords: {_ts_string_array(place.keywords, ind + '  ')},")
    lines.append(
        f"{ind}  coordinate: {{ latitude: {_ts_number(place.coordinate.latitude)}, "
        f"longitude: {_ts_number(place.coordinate.longitude)} }},"
    )
    if place.description:
        lines.append(f"{ind}  description: {_ts_string(place.description)},")
    if place.phone:
        lines.append(f"{ind}  phone: {_ts_string(place.phone)},")
    if place.detailed_schedule:
        arr = _ts_string_array(place.detailed_schedule, ind + "  ")
        lines.append(f"{ind}  detailedSchedule: {arr},")
    lines.append(f"{ind}}}")
    return "\n".join(lines)


_HEADER_TEMPLATE = """\
/**
 * ARCHIVO GENERADO — NO EDITAR A MANO.
 *
 * Producido por `app.tools.maps.build_unmsm_ts` a partir de la Google Places
 * API (New). Es material para REVISIÓN/DIFF; la fuente de verdad sigue siendo
 * el `unmsm.ts` curado a mano.
 *
 * Generado: {timestamp}
 * Lugares: {count}
 *
 * ADVERTENCIAS
 *  - ToS de Google: fuera del `place_id`, el contenido de Places no debe
 *    persistirse más de ~30 días. Trata este archivo como caché temporal:
 *    regenéralo, no lo archives como dataset permanente.
 *  - Centroide != entrada: `coordinate` es el centroide del POI que devuelve
 *    Places, NO la entrada peatonal que necesita el ruteo. Revísalas a mano
 *    (campo `entranceCoordinate` del interface curado).
 *  - Cobertura y calidad: sólo aparece lo que Google indexa dentro del
 *    rectángulo del campus; nombres, tipos y horarios pueden faltar o venir
 *    en inglés. Las `keywords` son heurísticas (nombre + types).
 */
"""


def render_ts(
    places: list[CampusPlace],
    *,
    timestamp: str = "{{GENERATED_AT}}",
    interface_import: str = './unmsm',
) -> str:
    """Serializa `places` a un módulo TS válido (`CAMPUS_PLACES: CampusPlace[]`).

    Reutiliza el interface curado vía `import type` para no duplicarlo y que el
    archivo compile contra la misma definición. `timestamp` es un placeholder
    por defecto (los tests son deterministas); el CLI inyecta la fecha real.
    """
    header = _HEADER_TEMPLATE.format(timestamp=timestamp, count=len(places))
    body = ",\n".join(_render_place(p) for p in places)
    array = "export const CAMPUS_PLACES: CampusPlace[] = ["
    if body:
        array += f"\n{body},\n];"
    else:
        array += "];"
    import_line = f'import type {{ CampusPlace }} from "{interface_import}";'
    return f"{header}\n{import_line}\n\n{array}\n"
