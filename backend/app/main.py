"""Punto de entrada de la API FastAPI.

Por ahora expone solo el healthcheck; el router del chat se conecta en un
paso posterior. Ejecuta en local con:

    uvicorn app.main:app --reload
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.chat import router as chat_router
from app.config import get_settings
from app.rag.providers import RagProviderError


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
    return app


app = create_app()
