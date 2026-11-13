"""Slugs de lugares: ids estables en minúsculas, dígitos y guiones (RF-22.7)."""

from __future__ import annotations

import re
import unicodedata

_SIGLA = re.compile(r"\(([A-Z0-9ÁÉÍÓÚÑ]{2,12})\)\s*$")


def slugify(text: str) -> str:
    """`«Facultad de Ingeniería»` → `facultad-de-ingenieria`."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    plain = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-")


def derive_slug(name: str, taken: set[str]) -> str:
    """Slug para `name` que no esté en `taken`.

    Usa la sigla entre paréntesis si la hay (`... (FISI)` → `fisi`); si no, el
    nombre completo. Si ya está tomado, añade `-2`, `-3`... No modifica `taken`.
    """
    match = _SIGLA.search(name)
    base = slugify(match.group(1)) if match else slugify(name)
    if not base:
        raise ValueError(f"No se puede derivar un slug de {name!r}")
    if base not in taken:
        return base
    counter = 2
    while f"{base}-{counter}" in taken:
        counter += 1
    return f"{base}-{counter}"
