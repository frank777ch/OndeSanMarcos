"""Recuperación con Supabase + pgvector.

Equivalente en producción del `Retriever` local: embebe la consulta, busca los
fragmentos más similares en la tabla vectorial (vía la función RPC
`match_documents`) y los mapea al mismo contrato `RetrievedChunk` que consume el
motor. Colapsa a documento padre (mejor puntaje) para igualar la semántica del
retriever local, conservando `place_id` para las tarjetas "Ver en mapa".

El acceso a la base se inyecta como un `Matcher` (una función), de modo que el
retriever es testeable sin `supabase` ni red. `app.rag.providers` construye el
`Matcher` real a partir del cliente de Supabase.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from app.knowledge.corpus import Document
from app.rag.embeddings import EmbeddingProvider
from app.rag.retriever import RetrievedChunk

# (vector de consulta, cuántas filas) -> filas de la RPC (dicts con
# `content`, `metadata`, `similarity`).
Matcher = Callable[[list[float], int], list[dict[str, Any]]]


def _rows_to_chunks(rows: list[dict[str, Any]]) -> list[RetrievedChunk]:
    """Mapea filas de `match_documents` a `RetrievedChunk`, colapsando por
    documento padre y quedándose con el mejor puntaje. No asume orden previo."""
    best: dict[str, RetrievedChunk] = {}
    for row in rows:
        content = row.get("content") or ""
        metadata = row.get("metadata") or {}
        score = float(row.get("similarity", 0.0))
        doc_id = str(metadata.get("document_id") or row.get("id") or content)
        current = best.get(doc_id)
        if current is not None and score <= current.score:
            continue
        document = Document(
            id=doc_id,
            title=metadata.get("title", ""),
            text=content,
            place_id=metadata.get("place_id"),
        )
        best[doc_id] = RetrievedChunk(document=document, score=score)

    chunks = list(best.values())
    chunks.sort(key=lambda chunk: chunk.score, reverse=True)
    return chunks


class PgVectorRetriever:
    """Recupera fragmentos desde pgvector usando embeddings reales."""

    def __init__(
        self,
        embedding: EmbeddingProvider,
        matcher: Matcher,
        *,
        oversample: int = 4,
    ) -> None:
        self._embedding = embedding
        self._matcher = matcher
        self._oversample = oversample

    def retrieve(self, query: str, top_k: int = 4) -> list[RetrievedChunk]:
        """Embebe la consulta, busca en pgvector y colapsa a top-k documentos."""
        query_vector = self._embedding.embed(query)
        rows = self._matcher(query_vector, max(top_k * self._oversample, top_k))
        return _rows_to_chunks(rows)[:top_k]
