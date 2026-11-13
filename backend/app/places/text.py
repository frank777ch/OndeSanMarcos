"""Normalización de texto para buscar sin tildes ni mayúsculas (HU-30)."""

from __future__ import annotations

import unicodedata


def normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.casefold())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").strip()
