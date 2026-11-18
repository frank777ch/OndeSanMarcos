"""Réplica en memoria de los métodos de eventos de `app.rag.db.Database`."""

from __future__ import annotations

from datetime import datetime, timezone

from app.events.timeutil import expires_at
from app.rag.db import ADMIN_EVENT_COLUMNS, EDITABLE_EVENT_COLUMNS, PUBLIC_EVENT_COLUMNS, event_slug

_LISTS = ("agenda", "keywords")


def _now() -> datetime:
    return datetime.now(timezone.utc)


class FakeEventsMixin:
    event_rows: dict[int, dict]
    next_event_id: int = 1
    place_rows: dict[int, dict]
    sync_events: list[dict]

    def _event_admin(self, row: dict) -> dict:
        defaults = {
            **{k: [] for k in _LISTS},
            "is_published": True, "category": "otro", "status": "scheduled", "modality": "in_person",
            "created_at": datetime(2026, 11, 12, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 11, 12, tzinfo=timezone.utc),
        }
        return {c: row.get(c, defaults.get(c)) for c in ADMIN_EVENT_COLUMNS}

    def upcoming_events(self):
        now = _now()
        rows = [
            e for e in self.event_rows.values()
            if e.get("is_published", True) and e.get("status", "scheduled") != "cancelled"
            and expires_at(e["starts_at"], e.get("ends_at")) > now
        ]
        rows.sort(key=lambda e: (e["starts_at"], e["id"]))
        return [{c: v for c, v in self._event_admin(e).items() if c in PUBLIC_EVENT_COLUMNS} for e in rows]

    def admin_list_events(self, place_id=None, published=None):
        rows = [self._event_admin(e) for e in self.event_rows.values()]
        rows = [
            e for e in rows
            if place_id in (None, e["place_id"]) and published in (None, e["is_published"])
        ]
        return sorted(rows, key=lambda e: (e["starts_at"], e["id"]), reverse=True)

    def admin_get_event(self, event_id):
        row = self.event_rows.get(event_id)
        return None if row is None else self._event_admin(row)

    def event_exists(self, event_id):
        return event_id in self.event_rows

    def create_event(self, data, username):
        event_id = self.next_event_id
        self.next_event_id += 1
        taken = {r["slug"] for r in self.event_rows.values()}
        base = event_slug(data["title"], data["starts_at"])
        slug, n = base, 2
        while slug in taken:
            slug, n = f"{base}-{n}", n + 1
        now = _now()
        row = {c: data.get(c) for c in EDITABLE_EVENT_COLUMNS}
        row.update(id=event_id, slug=slug, created_at=now, updated_at=now, updated_by=username)
        self.event_rows[event_id] = row
        return self._event_admin(row)

    def update_event(self, event_id, data, username):
        row = self.event_rows.get(event_id)
        if row is None:
            return None
        row.update({c: data.get(c) for c in EDITABLE_EVENT_COLUMNS})
        row["updated_at"] = _now()
        row["updated_by"] = username
        return self._event_admin(row)

    def delete_event(self, event_id):
        row = self.event_rows.get(event_id)
        if row is None:
            return ("not_found", 0)
        del self.event_rows[event_id]
        return ("deleted", row["slug"])

    def event_for_sync(self, event_id):
        row = self.event_rows.get(event_id)
        if row is None:
            return None
        place = self.place_rows.get(row.get("place_id"))
        parent = self.place_rows.get(place.get("parent_place_id")) if place else None
        return {
            **self._event_admin(row),
            "place_name": place["name"] if place else None,
            "place_slug": place["slug"] if place else None,
            "parent_name": parent["name"] if parent else None,
        }

    def events_for_sync(self):
        return [self.event_for_sync(i) for i in sorted(self.event_rows)]
