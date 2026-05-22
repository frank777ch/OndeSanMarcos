"""Punto de entrada de la API FastAPI.

Por ahora expone solo el healthcheck; el router del chat se conecta en un
paso posterior. Ejecuta en local con:

    uvicorn app.main:app --reload
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings


def create_app() -> FastAPI:
    """Crea y configura la aplicación FastAPI."""
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=__version__)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        """Verificación de vida del servicio."""
        return {"status": "ok", "service": settings.app_name, "version": __version__}

    return app


app = create_app()
