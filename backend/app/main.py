"""Punto de entrada de la API FastAPI.

Por ahora expone solo el healthcheck; el router del chat se conecta en un
paso posterior. Ejecuta en local con:

    uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.auth.admin import ensure_initial_admin
from app.auth.tokens import require_jwt_secret
from app.config import Settings, get_settings
from app.rag.db import get_database
from app.rag.providers import RagProviderError


logger = logging.getLogger(__name__)


def seed_admin(settings: Settings) -> None:
    """Crea el administrador inicial.

    Sin `DATABASE_URL` la app no arranca (error de configuración). Si faltan las
    credenciales del admin o la base no responde, avisa y deja arrancar.
    """
    if not settings.database_url:
        raise RuntimeError(
            "No se puede iniciar: falta la variable de entorno DATABASE_URL "
            "(defínela en backend/.env o en el entorno)."
        )
    if not (settings.admin_username and settings.admin_password):
        logger.warning(
            "No se creó el administrador inicial: faltan las variables de entorno "
            "ADMIN_USERNAME y/o ADMIN_PASSWORD."
        )
        return
    try:
        ensure_initial_admin(
            get_database(settings), settings.admin_username, settings.admin_password
        )
    except (RagProviderError, ValueError) as exc:
        logger.warning("No se pudo crear el administrador inicial: %s", exc)


def create_app() -> FastAPI:
    """Crea y configura la aplicación FastAPI."""
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        require_jwt_secret(settings.jwt_secret)
        seed_admin(settings)
        yield

    app = FastAPI(title=settings.app_name, version=__version__, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RagProviderError)
    async def _handle_provider_error(
        request: Request, exc: RagProviderError
    ) -> JSONResponse:
        """Proveedor real mal configurado o no disponible → 503 (no 500)."""
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        """Verificación de vida del servicio."""
        return {"status": "ok", "service": settings.app_name, "version": __version__}

    app.include_router(chat_router)
    app.include_router(auth_router)
    return app


app = create_app()
