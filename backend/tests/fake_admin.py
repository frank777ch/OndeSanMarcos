"""Almacén de administradores en memoria para los tests unitarios."""

from __future__ import annotations


class FakeAdminStore:
    def __init__(self) -> None:
        self.admins: dict[str, str] = {}

    def admin_exists(self, username: str) -> bool:
        return username in self.admins

    def get_admin(self, username: str) -> dict | None:
        if username not in self.admins:
            return None
        return {"username": username, "password_hash": self.admins[username]}

    def insert_admin(self, username: str, password_hash: str) -> bool:
        if username in self.admins:
            return False
        self.admins[username] = password_hash
        return True
