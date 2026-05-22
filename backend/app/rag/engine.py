"""Motor RAG: orquesta el pipeline completo de una consulta.

Pasos:
  1. Guardrails  — ¿la consulta es del dominio UNMSM? Si no, se declina.
  2. Recuperación — fragmentos más relevantes del corpus (top-k por coseno).
  3. Detección de lugares — por palabras clave de la consulta y por los
     documentos recuperados (para las tarjetas "Ver en mapa" del frontend).
  4. Generación  — el LLM redacta la respuesta anclada al contexto.
  5. Respuesta   — `ChatResponse { answer, locations }`, el contrato del chat.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from app.knowledge.places import CampusPlace, find_places, get_place_by_id
from app.rag import guardrails
from app.rag.llm import LLMProvider, TemplateLLM
from app.rag.retriever import RetrievedChunk, Retriever, build_default_retriever
from app.schemas.chat import ChatResponse, LocationResult

NO_INFO_MESSAGE = (
    "No tengo esa información oficial sobre el campus. Puedes preguntarme por "
    "lugares como el Rectorado, la Biblioteca Central o el Comedor Universitario."
)


class RAGEngine:
    """Coordina recuperación y generación para responder consultas del chat."""

    def __init__(
        self,
        retriever: Retriever,
        llm: LLMProvider,
        *,
        top_k: int = 4,
        score_threshold: float = 0.12,
    ) -> None:
        self._retriever = retriever
        self._llm = llm
        self._top_k = top_k
        self._score_threshold = score_threshold

    def answer(self, query: str) -> ChatResponse:
        """Responde una consulta siguiendo el pipeline RAG."""
        verdict = guardrails.check(query)
        if not verdict.allowed:
            return ChatResponse(answer=guardrails.OUT_OF_SCOPE_MESSAGE, locations=[])

        chunks = self._retriever.retrieve(query, self._top_k)
        relevant = [c for c in chunks if c.score >= self._score_threshold]
        places = self._detect_places(query, relevant)

        if not relevant and not places:
            return ChatResponse(answer=NO_INFO_MESSAGE, locations=[])

        contexts = [chunk.document.text for chunk in relevant]
        body = self._llm.generate(query, contexts) if contexts else ""
        answer_text = self._compose(body, places)

        locations = [
            LocationResult(id=place.id, name=place.name, schedule=place.schedule)
            for place in places
        ]
        return ChatResponse(answer=answer_text, locations=locations)

    def _detect_places(
        self, query: str, chunks: list[RetrievedChunk]
    ) -> list[CampusPlace]:
        """Lugares por palabras clave de la consulta + documentos recuperados."""
        ordered: list[CampusPlace] = []
        seen: set[str] = set()

        for place in find_places(query):
            if place.id not in seen:
                ordered.append(place)
                seen.add(place.id)

        for chunk in chunks:
            place_id = chunk.document.place_id
            if place_id and place_id not in seen:
                place = get_place_by_id(place_id)
                if place is not None:
                    ordered.append(place)
                    seen.add(place_id)

        return ordered

    def _compose(self, body: str, places: list[CampusPlace]) -> str:
        """Une la respuesta del LLM con una invitación a ver el mapa."""
        parts: list[str] = []
        if body:
            parts.append(body)
        elif places:
            first = places[0]
            parts.append(f"{first.name}. Horario: {first.schedule}.")

        if places:
            nudge = (
                'Toca "Ver en mapa" para ubicarlo.'
                if len(places) == 1
                else 'Toca "Ver en mapa" en cualquiera para ubicarlo.'
            )
            parts.append(nudge)

        return " ".join(parts)


def build_engine(settings: Settings | None = None) -> RAGEngine:
    """Construye el motor según la configuración (mock o real)."""
    settings = settings or get_settings()
    if settings.rag_use_mock:
        return RAGEngine(
            retriever=build_default_retriever(),
            llm=TemplateLLM(),
            top_k=settings.rag_top_k,
            score_threshold=settings.rag_score_threshold,
        )
    raise NotImplementedError(
        "Proveedores reales aún no configurados. Instala requirements-rag.txt y "
        "define LLM_PROVIDER / SUPABASE_*. Mientras tanto usa RAG_USE_MOCK=true."
    )


@lru_cache
def get_engine() -> RAGEngine:
    """Devuelve una instancia cacheada del motor RAG."""
    return build_engine()
