"""Base de datos falsa para los tests unitarios (sin Postgres)."""

from __future__ import annotations


class FakeDatabase:
    """Misma interfaz que `app.rag.db.Database`, en memoria."""

    def __init__(self, existing: int = 0, places: dict[str, int] | None = None):
        self.existing = existing
        self.places = dict(places or {})
        self.replaced: list[dict] | None = None
        self.place_replacements: dict[str, list[dict]] = {}

    def count(self) -> int:
        return self.existing

    def replace_all(self, rows: list[dict]) -> None:
        self.replaced = list(rows)

    def count_place(self, place_id: str) -> int:
        return self.places.get(place_id, 0)

    def replace_place(self, place_id: str, rows: list[dict]) -> None:
        self.place_replacements[place_id] = list(rows)

    def place_ids(self) -> set[str]:
        return set(self.places)
