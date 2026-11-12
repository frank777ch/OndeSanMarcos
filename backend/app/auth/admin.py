"""Creación del administrador inicial."""

from __future__ import annotations

import logging
from typing import Protocol

from app.auth.passwords import hash_password

logger = logging.getLogger(__name__)


class AdminStore(Protocol):
    def admin_exists(self, username: str) -> bool: ...

    def insert_admin(self, username: str, password_hash: str) -> bool: ...


def ensure_initial_admin(store: AdminStore, username: str, password: str) -> bool:
    """Crea el administrador si no existe. Devuelve `True` si lo creó.

    Si ya existe no toca su contraseña. Sin `username` o `password` no hace nada.
    """
    if not username or not password:
        return False
    if store.admin_exists(username):
        return False
    created = store.insert_admin(username, hash_password(password))
    if created:
        logger.info("Administrador inicial «%s» creado.", username)
    return created
