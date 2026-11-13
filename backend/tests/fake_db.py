"""Base de datos falsa para los tests unitarios (sin Postgres)."""

from __future__ import annotations

from tests.fake_places_admin import FakePlacesAdminMixin


class FakeDatabase(FakePlacesAdminMixin):
    """Misma interfaz que `app.rag.db.Database`, en memoria."""

    def __init__(self, existing: int = 0, places: dict[str, int] | None = None):
        self.existing = existing
        self.places = dict(places or {})
        self.replaced: list[dict] | None = None
        self.place_replacements: dict[str, list[dict]] = {}
        self.categories: dict[str, dict] = {}
        self.place_rows: dict[str, dict] = {}
        self.insert_calls = 0

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

    def insert_place_categories(self, rows: list[dict]) -> int:
        self.insert_calls += 1
        added = 0
        for row in rows:
            if row["id"] not in self.categories:
                self.categories[row["id"]] = dict(row)
                added += 1
        return added

    def insert_places(self, rows: list[dict]) -> int:
        self.insert_calls += 1
        added = 0
        for row in rows:
            if row["id"] not in self.place_rows:
                self.place_rows[row["id"]] = dict(row)
                added += 1
        return added

    # --- lectura pública de lugares (HU-27) ---------------------------------

    def list_place_categories(self) -> list[dict]:
        rows = sorted(self.categories.values(), key=lambda c: (c.get("sort_order", 0), c["id"]))
        return [{"id": c["id"], "label": c["label"], "color": c["color"]} for c in rows]

    def list_places(self, category_id: str | None = None) -> list[dict]:
        rows = [self._public(p) for p in self.place_rows.values()]
        rows = [p for p in rows if p["is_published"] and category_id in (None, p["category_id"])]
        return sorted(rows, key=lambda p: (p["name"], p["id"]))

    def get_place(self, place_id: str) -> dict | None:
        row = self.place_rows.get(place_id)
        if row is None:
            return None
        public = self._public(row)
        return public if public["is_published"] else None

    def search_places(self, query: str, limit: int = 8) -> list[dict]:
        """Réplica en Python de la búsqueda de Postgres (niveles 0–3 y un parecido simple)."""
        from difflib import SequenceMatcher

        from app.places.text import normalize_text

        q = normalize_text(query)
        ranked: list[tuple[int, float, str, str, dict]] = []
        for row in self.place_rows.values():
            public = self._public(row)
            if not public["is_published"]:
                continue
            name = normalize_text(public["name"])
            short = normalize_text(public["short_name"] or "")
            kws = [normalize_text(k) for k in public["keywords"]]
            fuzzy = max(
                [SequenceMatcher(None, q, w).ratio() for w in name.split() + kws + ([short] if short else [])],
                default=0.0,
            )
            if short == q or q in kws:
                level = 0
            elif name.startswith(q):
                level = 1
            elif q in name:
                level = 2
            elif q in short or any(q in k for k in kws):
                level = 3
            elif len(q) >= 3 and fuzzy >= 0.7:
                level = 4
            else:
                continue
            ranked.append((level, -fuzzy, public["name"], public["id"], public))
        ranked.sort(key=lambda r: r[:4])
        return [r[4] for r in ranked[:limit]]

    @staticmethod
    def _public(row: dict) -> dict:
        """Fila con los mismos campos que `PUBLIC_PLACE_COLUMNS`, con valores por defecto."""
        from datetime import datetime, timezone

        from app.rag.db import PUBLIC_PLACE_COLUMNS

        defaults = {
            "keywords": [], "detailed_schedule": [], "careers": [], "services": [],
            "is_published": True, "verified_at": None,
            "updated_at": datetime(2026, 11, 12, tzinfo=timezone.utc),
        }
        return {c: row.get(c, defaults.get(c)) for c in PUBLIC_PLACE_COLUMNS}
