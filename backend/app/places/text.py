"""Normalización de texto para buscar sin tildes ni mayúsculas (HU-30)."""

from __future__ import annotations

import re
import unicodedata


def normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.casefold())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").strip()


_NON_SLUG = re.compile(r"[^a-z0-9]+")
MAX_SLUG_LENGTH = 100


def slugify(name: str, fallback: str = "lugar") -> str:
    """Nombre → slug: minúsculas, sin tildes y con guiones (`Biblioteca Central` → `biblioteca-central`)."""
    slug = _NON_SLUG.sub("-", normalize_text(name)).strip("-")[:MAX_SLUG_LENGTH].strip("-")
    return slug or fallback


def parse_place_id(raw: str) -> int | None:
    """Id de lugar tomado de una ruta: entero positivo, o `None` si no lo es (la ruta responde 404)."""
    if not raw.isascii() or not raw.isdigit() or len(raw) > 18:
        return None
    value = int(raw)
    return value if value > 0 else None
