"""Endpoint del asistente: `POST /api/chat`.

Conecta el motor RAG con el contrato que ya consume el frontend
(`services/api/chatApi.ts`). El motor se inyecta como dependencia, lo que
facilita sustituirlo en los tests.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.rag.engine import RAGEngine, get_engine
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    engine: RAGEngine = Depends(get_engine),
) -> ChatResponse:
    """Responde una consulta del usuario usando el motor RAG."""
    return engine.answer(request.query)
