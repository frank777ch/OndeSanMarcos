"""Almacén de administradores en memoria para los tests unitarios."""

from __future__ import annotations

from datetime import datetime, timezone


class FakeAdminStore:
    def __init__(self) -> None:
        self.admins: dict[str, str] = {}

    def admin_exists(self, username: str) -> bool:
        return username in self.admins

    def get_admin(self, username: str) -> dict | None:
        if username not in self.admins:
            return None
        return {
            "username": username,
            "password_hash": self.admins[username],
            "created_at": datetime(2026, 1, 15, 10, 30, tzinfo=timezone.utc),
        }

    def update_admin_password(self, username: str, password_hash: str) -> bool:
        if username not in self.admins:
            return False
        self.admins[username] = password_hash
        return True

    def insert_admin(self, username: str, password_hash: str) -> bool:
        if username in self.admins:
            return False
        self.admins[username] = password_hash
        return True
