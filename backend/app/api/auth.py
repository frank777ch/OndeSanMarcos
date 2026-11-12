"""Login del administrador: `POST /api/auth/login` y `GET /api/auth/me`."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_admin, get_store
from app.auth.rate_limit import LoginRateLimiter, get_limiter
from app.auth.service import AdminLookup, authenticate
from app.auth.tokens import create_access_token
from app.config import Settings, get_settings
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    store: AdminLookup = Depends(get_store),
    settings: Settings = Depends(get_settings),
    limiter: LoginRateLimiter = Depends(get_limiter),
) -> TokenResponse:
    """Canjea usuario y contraseña por un token de acceso."""
    key = limiter.key(body.username)

    retry_after = limiter.retry_after(key)
    if retry_after:
        logger.warning("Login bloqueado por demasiados intentos: %r", body.username)
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos fallidos. Inténtalo más tarde.",
            headers={"Retry-After": str(retry_after)},
        )

    if not authenticate(store, body.username, body.password):
        limiter.record_failure(key)
        logger.warning("Login fallido: %r", body.username)
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

    limiter.record_success(key)
    token, expires_in = create_access_token(
        body.username, settings.jwt_secret, settings.access_token_expire_minutes
    )
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=MeResponse)
def me(username: str = Depends(get_current_admin)) -> MeResponse:
    """Administrador autenticado (sirve para comprobar que el token sigue vigente)."""
    return MeResponse(username=username)
