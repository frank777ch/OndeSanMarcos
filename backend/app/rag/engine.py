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
from app.rag.intent import wants_route
from app.rag.llm import LLMProvider
from app.rag.providers import build_llm_provider, build_retriever
from app.rag.retriever import RetrievedChunk, SupportsRetrieve
from app.schemas.chat import ChatResponse, Coordinate, LocationResult

NO_INFO_MESSAGE = (
    "No tengo esa información oficial sobre el campus. Puedes preguntarme por "
    "lugares como el Rectorado, la Biblioteca Central o el Comedor Universitario."
)


class RAGEngine:
    """Coordina recuperación y generación para responder consultas del chat."""

    def __init__(
        self,
        retriever: SupportsRetrieve,
        llm: LLMProvider,
        *,
        top_k: int = 4,
        score_threshold: float = 0.55,
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

        draw_route = bool(places) and wants_route(query)

        contexts = [chunk.document.text for chunk in relevant]
        body = self._llm.generate(query, contexts) if contexts else ""
        answer_text = self._compose(body, places, draw_route)

        locations = [
            LocationResult(id=place.id, name=place.name, schedule=place.schedule)
            for place in places
        ]
        destination = (
            Coordinate(
                latitude=places[0].coordinate.latitude,
                longitude=places[0].coordinate.longitude,
            )
            if draw_route
            else None
        )
        return ChatResponse(
            answer=answer_text,
            locations=locations,
            draw_route=draw_route,
            destination=destination,
        )

    def _detect_places(
        self, query: str, chunks: list[RetrievedChunk]
    ) -> list[CampusPlace]:
        """Lugares relevantes: nombrados en la consulta + el más recuperado.

        `chunks` viene ordenado por puntaje descendente. Señal fuerte: lugares que
        la consulta nombra por palabra clave (`find_places`). Señal de
        recuperación: **solo** el lugar del documento más relevante (`chunks[0]`).
        Se evita un umbral relativo porque no discrimina con embeddings densos (las
        similitudes quedan altas y comprimidas); tomar únicamente el mejor documento
        es fiable en cualquier escala y no arrastra menciones incidentales.
        """
        ordered: list[CampusPlace] = []
        seen: set[str] = set()

        for place in find_places(query):
            if place.id not in seen:
                ordered.append(place)
                seen.add(place.id)

        if chunks:
            place_id = chunks[0].document.place_id
            if place_id and place_id not in seen:
                place = get_place_by_id(place_id)
                if place is not None:
                    ordered.append(place)
                    seen.add(place_id)

        return ordered

    def _compose(
        self, body: str, places: list[CampusPlace], draw_route: bool = False
    ) -> str:
        """Une la respuesta del LLM con una invitación a ver el mapa o la ruta."""
        parts: list[str] = []
        if body:
            parts.append(body)
        elif places:
            first = places[0]
            parts.append(f"{first.name}. Horario: {first.schedule}.")

        if draw_route and places:
            parts.append(f"Te guío a {places[0].name}: trazo la ruta en el mapa.")
        elif places:
            nudge = (
                'Toca "Ver en mapa" para ubicarlo.'
                if len(places) == 1
                else 'Toca "Ver en mapa" en cualquiera para ubicarlo.'
            )
            parts.append(nudge)

        return " ".join(parts)


def build_engine(settings: Settings | None = None) -> RAGEngine:
    """Construye el motor según la configuración (mock o real).

    Las implementaciones concretas (retriever y LLM) las decide
    `app.rag.providers` a partir de la configuración. En modo real, si falta
    una llave o dependencia se lanza `RagProviderError` con un mensaje claro.
    """
    settings = settings or get_settings()
    return RAGEngine(
        retriever=build_retriever(settings),
        llm=build_llm_provider(settings),
        top_k=settings.rag_top_k,
        score_threshold=settings.rag_score_threshold,
    )


@lru_cache
def get_engine() -> RAGEngine:
    """Devuelve una instancia cacheada del motor RAG."""
    return build_engine()
