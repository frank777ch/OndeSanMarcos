"""Verificación de credenciales."""

from __future__ import annotations

from typing import Protocol

from app.auth.passwords import hash_password, verify_password

# Hash de relleno: si el usuario no existe se verifica igual contra este, para que
# el tiempo de respuesta no delate qué usuarios existen.
_DUMMY_HASH = hash_password("contraseña-de-relleno")


class AdminLookup(Protocol):
    def get_admin(self, username: str) -> dict | None: ...
    def update_admin_password(self, username: str, password_hash: str) -> bool: ...


def authenticate(store: AdminLookup, username: str, password: str) -> bool:
    """`True` si el usuario existe y la contraseña coincide."""
    admin = store.get_admin(username)
    if admin is None:
        verify_password(password, _DUMMY_HASH)
        return False
    return verify_password(password, admin["password_hash"])
