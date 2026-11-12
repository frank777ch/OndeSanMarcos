"""Dependencias de FastAPI para autenticar al administrador.

Para proteger un endpoint basta con `admin: str = Depends(get_current_admin)`.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.service import AdminLookup
from app.auth.tokens import InvalidToken, decode_access_token
from app.config import get_settings
from app.rag.db import get_database

_bearer = HTTPBearer(auto_error=False)


def get_store() -> AdminLookup:
    """Base de datos de administradores (se reemplaza en los tests)."""
    return get_database(get_settings())


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=401,
        detail="No autenticado.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    store: AdminLookup = Depends(get_store),
) -> str:
    """Devuelve el `username` del administrador del token o responde 401."""
    if credentials is None:
        raise _unauthorized()
    try:
        username = decode_access_token(credentials.credentials, get_settings().jwt_secret)
    except InvalidToken:
        raise _unauthorized() from None
    if store.get_admin(username) is None:
        raise _unauthorized()
    return username
