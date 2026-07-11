"""Lector del dataset de lugares del frontend (`unmsm.ts`).

El mapa mantiene la lista de lugares del campus en
`frontend/src/features/map/constants/unmsm.ts` (`CAMPUS_PLACES`). Aquí se extrae
esa lista **sin** un runtime de TypeScript: se escanea el array respetando
strings y comentarios, y se sacan los campos de cada objeto con expresiones
regulares acotadas al bloque. Se usa para detectar "gaps" entre lo que el mapa
conoce y lo que el corpus (Supabase) describe (ver `app/rag/find_gaps.py`).

Es un parser tolerante, pensado para el formato regular que usa el equipo de
mapa (claves sin comillas, strings con comillas dobles, un objeto por lugar).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

# backend/app/knowledge/unmsm_ts.py  ->  parents[3] = raíz del monorepo
_REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_UNMSM_TS = (
    _REPO_ROOT / "frontend" / "src" / "features" / "map" / "constants" / "unmsm.ts"
)

# String de TS con comillas dobles (soporta escapes: \" \\ ...).
_STR = r'"((?:[^"\\]|\\.)*)"'


@dataclass(frozen=True)
class MapPlace:
    """Un lugar del mapa (`CAMPUS_PLACES` de `unmsm.ts`)."""

    id: str
    name: str = ""
    schedule: str = ""
    keywords: tuple[str, ...] = ()
    latitude: float | None = None
    longitude: float | None = None
    description: str = ""
    phone: str = ""
    annex: str = ""
    usage: str = ""
    careers: tuple[str, ...] = ()
    services: tuple[str, ...] = ()
    detailed_schedule: tuple[str, ...] = ()

    @property
    def has_description(self) -> bool:
        """¿Trae texto descriptivo real (más allá del nombre)?"""
        return bool(self.description.strip())


def load_map_places(path: str | Path | None = None) -> list[MapPlace]:
    """Lee y parsea los lugares de `unmsm.ts` (usa la ruta por defecto si no se da)."""
    file = Path(path) if path else DEFAULT_UNMSM_TS
    return parse_places(file.read_text(encoding="utf-8"))


def parse_places(source: str, const_name: str = "CAMPUS_PLACES") -> list[MapPlace]:
    """Parsea el array `const_name` del contenido de un `unmsm.ts`."""
    body = _array_body(source, const_name)
    places: list[MapPlace] = []
    for block in _iter_objects(body):
        place_id = _find_str(block, "id")
        if not place_id:
            continue
        places.append(
            MapPlace(
                id=place_id,
                name=_find_str(block, "name"),
                schedule=_find_str(block, "schedule"),
                keywords=_find_array(block, "keywords"),
                latitude=_find_number(block, "latitude"),
                longitude=_find_number(block, "longitude"),
                description=_find_str(block, "description"),
                phone=_find_str(block, "phone"),
                annex=_find_str(block, "annex"),
                usage=_find_str(block, "usage"),
                careers=_find_array(block, "careers"),
                services=_find_array(block, "services"),
                detailed_schedule=_find_array(block, "detailedSchedule"),
            )
        )
    return places


# --------------------------------------------------------------------------- #
# Escaneo tolerante (strings + comentarios).
# --------------------------------------------------------------------------- #
def _array_body(source: str, const_name: str) -> str:
    """Texto entre los `[` `]` del `export const <const_name>: CampusPlace[] = [`."""
    match = re.search(
        rf"export\s+const\s+{re.escape(const_name)}\s*:\s*CampusPlace\[\]\s*=\s*\[",
        source,
    )
    if not match:
        raise ValueError(f"No se encontró 'export const {const_name}' en el archivo.")
    open_idx = match.end() - 1  # posición del '['
    close_idx = _match_bracket(source, open_idx)
    return source[open_idx + 1 : close_idx]


def _iter_objects(body: str):
    """Genera el texto de cada objeto `{...}` de nivel superior del array."""
    i, n = 0, len(body)
    while i < n:
        char = body[i]
        if char in "\"'`":
            i = _skip_string(body, i)
            continue
        if char == "/" and i + 1 < n and body[i + 1] == "/":
            nl = body.find("\n", i)
            i = n if nl == -1 else nl + 1
            continue
        if char == "/" and i + 1 < n and body[i + 1] == "*":
            end = body.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        if char == "{":
            close = _match_bracket(body, i)
            yield body[i : close + 1]
            i = close + 1
            continue
        i += 1


def _match_bracket(source: str, start: int) -> int:
    """Índice del cierre que corresponde al bracket abierto en `start`.

    Respeta strings (`"`, `'`, `` ` ``) y comentarios (`//`, `/* */`).
    """
    pairs = {"[": "]", "{": "}", "(": ")"}
    open_ch = source[start]
    close_ch = pairs[open_ch]
    depth = 0
    i, n = start, len(source)
    while i < n:
        char = source[i]
        if char in "\"'`":
            i = _skip_string(source, i)
            continue
        if char == "/" and i + 1 < n and source[i + 1] == "/":
            nl = source.find("\n", i)
            i = n if nl == -1 else nl
            continue
        if char == "/" and i + 1 < n and source[i + 1] == "*":
            end = source.find("*/", i + 2)
            i = n if end == -1 else end + 2
            continue
        if char == open_ch:
            depth += 1
        elif char == close_ch:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError("Bracket sin cierre en el archivo.")


def _skip_string(source: str, i: int) -> int:
    """Índice justo después del string que abre en `i`."""
    quote = source[i]
    i += 1
    n = len(source)
    while i < n:
        char = source[i]
        if char == "\\":
            i += 2
            continue
        if char == quote:
            return i + 1
        i += 1
    return n


# --------------------------------------------------------------------------- #
# Extracción de campos dentro de un bloque `{...}`.
# --------------------------------------------------------------------------- #
def _find_str(block: str, key: str) -> str:
    match = re.search(rf"\b{key}\s*:\s*{_STR}", block)
    return _unescape(match.group(1)) if match else ""


def _find_number(block: str, key: str) -> float | None:
    match = re.search(rf"\b{key}\s*:\s*(-?\d+(?:\.\d+)?)", block)
    return float(match.group(1)) if match else None


def _find_array(block: str, key: str) -> tuple[str, ...]:
    match = re.search(rf"\b{key}\s*:\s*\[", block)
    if not match:
        return ()
    open_idx = match.end() - 1
    close_idx = _match_bracket(block, open_idx)
    inner = block[open_idx + 1 : close_idx]
    return tuple(_unescape(item) for item in re.findall(_STR, inner))


def _unescape(value: str) -> str:
    return value.replace('\\"', '"').replace("\\\\", "\\").replace("\\/", "/")
