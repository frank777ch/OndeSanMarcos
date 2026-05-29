"""Esquemas Pydantic del backend (contrato de la API)."""

from app.schemas.chat import ChatRequest, ChatResponse, LocationResult

__all__ = ["ChatRequest", "ChatResponse", "LocationResult"]
