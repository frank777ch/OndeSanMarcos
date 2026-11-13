"""Login del administrador: `POST /api/auth/login` y `GET /api/auth/me`."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth.dependencies import get_current_admin, get_store
from app.auth.rate_limit import LoginRateLimiter, get_limiter
from app.auth.service import AdminLookup, authenticate
from app.auth.tokens import create_access_token
from app.config import Settings, get_settings
from app.auth.passwords import hash_password
from app.schemas.auth import ChangePasswordRequest, LoginRequest, MeResponse, TokenResponse

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
def me(
    username: str = Depends(get_current_admin),
    store: AdminLookup = Depends(get_store),
) -> MeResponse:
    """Administrador autenticado (sirve para comprobar que el token sigue vigente) y su fecha de alta."""
    admin = store.get_admin(username)
    if admin is None:
        raise HTTPException(status_code=401, detail="No autenticado.", headers={"WWW-Authenticate": "Bearer"})
    return MeResponse(username=username, created_at=admin["created_at"])


@router.post(
    "/change-password",
    status_code=204,
    summary="Cambiar la contraseña del administrador autenticado",
    responses={
        401: {"description": "Sin sesión válida."},
        403: {"description": "La contraseña actual no es correcta."},
        422: {"description": "La contraseña nueva no cumple la política."},
        429: {"description": "Demasiados intentos fallidos; ver `Retry-After`."},
    },
)
def change_password(
    body: ChangePasswordRequest,
    username: str = Depends(get_current_admin),
    store: AdminLookup = Depends(get_store),
    limiter: LoginRateLimiter = Depends(get_limiter),
) -> Response:
    """Guarda una contraseña nueva. Una actual incorrecta cuenta en el mismo límite que el login."""
    key = limiter.key(username)
    retry_after = limiter.retry_after(key)
    if retry_after:
        logger.warning("Cambio de contraseña bloqueado por demasiados intentos: %r", username)
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos fallidos. Inténtalo más tarde.",
            headers={"Retry-After": str(retry_after)},
        )
    if not authenticate(store, username, body.current_password):
        limiter.record_failure(key)
        logger.warning("Cambio de contraseña con contraseña actual incorrecta: %r", username)
        raise HTTPException(status_code=403, detail="La contraseña actual no es correcta.")
    limiter.record_success(key)
    if not store.update_admin_password(username, hash_password(body.new_password)):
        raise HTTPException(status_code=401, detail="No autenticado.", headers={"WWW-Authenticate": "Bearer"})
    logger.info("Contraseña cambiada: %r", username)
    return Response(status_code=204)
