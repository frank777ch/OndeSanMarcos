"""Réplica en memoria de los métodos de administración de lugares (HU-30)."""

from __future__ import annotations

from datetime import datetime, timezone

from app.rag.db import ADMIN_PLACE_COLUMNS, EDITABLE_PLACE_COLUMNS, DuplicateError

_LISTS = ("keywords", "detailed_schedule", "careers", "services")


def _now() -> datetime:
    return datetime.now(timezone.utc)


class FakePlacesAdminMixin:
    categories: dict[str, dict]
    place_rows: dict[str, dict]
    next_place_id: int = 1000

    def _admin(self, row: dict) -> dict:
        defaults = {
            **{k: [] for k in _LISTS},
            "is_published": True, "verified_at": None,
            "updated_at": datetime(2026, 11, 12, tzinfo=timezone.utc),
            "created_at": datetime(2026, 11, 12, tzinfo=timezone.utc), "updated_by": None,
        }
        return {c: row.get(c, defaults.get(c)) for c in ADMIN_PLACE_COLUMNS}

    def admin_list_places(self, category_id=None, published=None, verified=None):
        rows = [self._admin(p) for p in self.place_rows.values()]
        rows = [
            p for p in rows
            if category_id in (None, p["category_id"])
            and published in (None, p["is_published"])
            and verified in (None, p["verified_at"] is not None)
        ]
        return sorted(rows, key=lambda p: (p["name"], p["id"]))

    def admin_get_place(self, place_id):
        row = self.place_rows.get(place_id)
        return None if row is None else self._admin(row)

    def category_exists(self, category_id):
        return category_id in self.categories

    def place_exists(self, place_id):
        return place_id in self.place_rows

    def would_create_cycle(self, place_id, parent_id):
        seen, current = set(), parent_id
        while current is not None and current not in seen:
            if current == place_id:
                return True
            seen.add(current)
            current = self.place_rows.get(current, {}).get("parent_place_id")
        return False

    def create_place(self, data, verified, username):
        place_id = str(self.next_place_id)
        self.next_place_id += 1
        now = _now()
        row = {c: data.get(c) for c in EDITABLE_PLACE_COLUMNS}
        row.update(
            id=place_id, verified_at=now if verified else None,
            created_at=now, updated_at=now, updated_by=username,
        )
        self.place_rows[place_id] = row
        return self._admin(row)

    def update_place(self, place_id, data, verified, username):
        row = self.place_rows.get(place_id)
        if row is None:
            return None
        previous = row.get("verified_at")
        row.update({c: data.get(c) for c in EDITABLE_PLACE_COLUMNS})
        row["verified_at"] = (previous or _now()) if verified else None
        row["updated_at"] = _now()
        row["updated_by"] = username
        return self._admin(row)

    def _category_admin(self, c):
        count = sum(1 for p in self.place_rows.values() if p["category_id"] == c["id"])
        return {"id": c["id"], "label": c["label"], "color": c["color"],
                "sort_order": c.get("sort_order", 0), "places_count": count}

    def admin_list_categories(self):
        rows = sorted(self.categories.values(), key=lambda c: (c.get("sort_order", 0), c["id"]))
        return [self._category_admin(c) for c in rows]

    def create_category(self, category_id, label, color, sort_order):
        if category_id in self.categories:
            raise DuplicateError(category_id)
        if sort_order is None:
            sort_order = max((c.get("sort_order", 0) for c in self.categories.values()), default=-1) + 1
        self.categories[category_id] = {"id": category_id, "label": label, "color": color, "sort_order": sort_order}
        return self._category_admin(self.categories[category_id])

    def update_category(self, category_id, label, color, sort_order):
        c = self.categories.get(category_id)
        if c is None:
            return None
        c.update(label=label, color=color)
        if sort_order is not None:
            c["sort_order"] = sort_order
        return self._category_admin(c)

    def delete_category(self, category_id):
        if category_id not in self.categories:
            return ("not_found", 0)
        n = sum(1 for p in self.place_rows.values() if p["category_id"] == category_id)
        if n:
            return ("in_use", n)
        del self.categories[category_id]
        return ("deleted", 0)
