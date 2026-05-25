"""Esquemas del endpoint `/api/chat`.

Reflejan exactamente el contrato que ya espera el frontend
(`src/features/chat/types/index.ts`):

    Petición:  { "query": string }
    Respuesta: { "answer": string, "locations": LocationResult[] }
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Consulta del usuario al asistente."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Pregunta del usuario en lenguaje natural.",
    )


class LocationResult(BaseModel):
    """Lugar del campus devuelto como resultado de una consulta."""

    id: str = Field(..., description="Identificador estable del lugar, ej. 'rectorado'.")
    name: str = Field(..., description="Nombre legible, ej. 'Rectorado'.")
    schedule: str | None = Field(
        default=None, description="Horario de atención, si aplica."
    )


class Coordinate(BaseModel):
    """Coordenada geográfica (igual que el `Coordinate` del frontend)."""

    latitude: float = Field(..., description="Latitud en grados decimales.")
    longitude: float = Field(..., description="Longitud en grados decimales.")


class ChatResponse(BaseModel):
    """Respuesta del asistente para una consulta.

    Los campos `draw_route` y `destination` implementan el enrutamiento
    automático (HU-2.3): cuando el usuario pide cómo llegar a un lugar, el
    frontend cambia a la pestaña Mapa y traza la ruta hacia `destination`.
    """

    answer: str = Field(..., description="Respuesta en lenguaje natural.")
    locations: list[LocationResult] = Field(
        default_factory=list,
        description="Lugares relacionados con la consulta (para 'Ver en mapa').",
    )
    draw_route: bool = Field(
        default=False,
        description="True si el frontend debe trazar una ruta hacia 'destination'.",
    )
    destination: Coordinate | None = Field(
        default=None,
        description="Coordenada destino cuando se solicita enrutamiento.",
    )
