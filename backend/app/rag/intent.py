"""Detección de intención de navegación (HU-2.3).

Distingue cuándo el usuario pide *cómo llegar* a un lugar (queremos trazar una
ruta) de cuándo solo pregunta *por* un lugar (basta con mostrarlo). La
detección es léxica y determinista: busca verbos/locuciones de desplazamiento
sobre la consulta normalizada (sin tildes).
"""

from __future__ import annotations

import re

from app.knowledge.places import normalize

# Locuciones de desplazamiento, ya normalizadas (sin tildes). Se usan límites
# de palabra para evitar falsos positivos (p. ej. "ruta" dentro de "frutas").
_ROUTE_PATTERNS: tuple[str, ...] = (
    r"como\s+llego",
    r"como\s+llegar",
    r"como\s+voy",
    r"como\s+ir",
    r"como\s+puedo\s+llegar",
    r"llevame",
    r"guiame",
    r"llegar\s+a",
    r"llegar\s+al",
    r"ir\s+a",
    r"ir\s+al",
    r"ir\s+hacia",
    r"voy\s+a",
    r"quiero\s+ir",
    r"necesito\s+ir",
    r"dirigirme",
    r"ruta",
    r"rutas",
    r"camino\s+a",
    r"camino\s+hacia",
    r"trazar\s+ruta",
)

_ROUTE_REGEX = re.compile(r"\b(?:" + "|".join(_ROUTE_PATTERNS) + r")\b")


def wants_route(query: str) -> bool:
    """True si la consulta expresa intención de desplazarse a un lugar."""
    return _ROUTE_REGEX.search(normalize(query)) is not None
