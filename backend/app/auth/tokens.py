"""Emisión y lectura del token de acceso (JWT firmado con HS256)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

ALGORITHM = "HS256"
MIN_JWT_SECRET_LENGTH = 32


class InvalidToken(Exception):
    """Token ausente, mal formado, alterado o vencido."""


def require_jwt_secret(secret: str) -> None:
    """Falla al arrancar si `JWT_SECRET` falta o es demasiado corta."""
    if len(secret) < MIN_JWT_SECRET_LENGTH:
        raise RuntimeError(
            "No se puede iniciar: falta la variable de entorno JWT_SECRET o tiene "
            f"menos de {MIN_JWT_SECRET_LENGTH} caracteres (defínela en backend/.env)."
        )


def create_access_token(
    username: str,
    secret: str,
    expire_minutes: int,
    now: datetime | None = None,
) -> tuple[str, int]:
    """Devuelve `(token, expires_in_segundos)`."""
    issued = now or datetime.now(timezone.utc)
    expires = issued + timedelta(minutes=expire_minutes)
    token = jwt.encode(
        {"sub": username, "iat": issued, "exp": expires}, secret, algorithm=ALGORITHM
    )
    return token, expire_minutes * 60


def decode_access_token(token: str, secret: str) -> str:
    """Devuelve el `username` del token o lanza `InvalidToken`."""
    try:
        claims = jwt.decode(
            token, secret, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]}
        )
    except jwt.PyJWTError as exc:
        raise InvalidToken from exc
    username = claims.get("sub")
    if not isinstance(username, str) or not username:
        raise InvalidToken
    return username
