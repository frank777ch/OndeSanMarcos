"""Recuperación de contexto: indexa el corpus (vía ingesta) y busca top-k.

El `Retriever` alimenta el almacén vectorial usando el pipeline de ingesta
(troceado + embeddings) y, dada una consulta, devuelve los documentos más
relevantes por similitud coseno. Es el equivalente aislado del índice que en
producción resuelve `PgVectorRetriever` (embeddings Gemini + Supabase/pgvector),
intercambiable por el `Protocol` `SupportsRetrieve`.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Protocol

from app.knowledge.corpus import DOCUMENTS, Document
from app.rag.embeddings import (
    BagOfWordsEmbedding,
    EmbeddingProvider,
    build_vocabulary,
)
from app.rag.ingestion import ingest_chunks, split_document
from app.rag.vector_store import InMemoryVectorStore, VectorRecord


@dataclass(frozen=True)
class RetrievedChunk:
    """Documento recuperado junto con su puntaje de similitud."""

    document: Document
    score: float


class SupportsRetrieve(Protocol):
    """Interfaz de recuperación que consume el motor RAG.

    La implementa tanto el `Retriever` local (mock, bag-of-words en memoria) como
    `PgVectorRetriever` (Supabase + pgvector), de modo que el motor no depende de
    una implementación concreta.
    """

    def retrieve(self, query: str, top_k: int = 4) -> list[RetrievedChunk]: ...


class Retriever:
    """Indexa documentos (troceados) y recupera los más relevantes."""

    def __init__(
        self,
        embedding: EmbeddingProvider,
        documents: Iterable[Document] | None = None,
        *,
        chunk_size: int = 400,
        chunk_overlap: int = 60,
    ) -> None:
        self._embedding = embedding
        self._chunk_size = chunk_size
        self._chunk_overlap = chunk_overlap
        self._store = InMemoryVectorStore()
        self._docs_by_id: dict[str, Document] = {}
        source = DOCUMENTS if documents is None else documents
        for document in source:
            self.add_document(document)

    def add_document(self, document: Document) -> None:
        """Trocea, vectoriza e indexa un documento."""
        self._docs_by_id[document.id] = document
        chunks = split_document(
            document, chunk_size=self._chunk_size, overlap=self._chunk_overlap
        )
        ingest_chunks(chunks, self._embedding, self._store)

    def retrieve(self, query: str, top_k: int = 4) -> list[RetrievedChunk]:
        """Devuelve los `top_k` documentos más relevantes para la consulta.

        Busca a nivel de fragmento y luego colapsa al documento padre,
        quedándose con el mejor puntaje de cada documento.
        """
        query_vector = self._embedding.embed(query)
        candidates = self._store.search(query_vector, max(top_k * 4, top_k))

        best_by_doc: dict[str, float] = {}
        for record, score in candidates:
            doc_id = self._document_id_of(record)
            if doc_id not in best_by_doc or score > best_by_doc[doc_id]:
                best_by_doc[doc_id] = score

        ranked = sorted(best_by_doc.items(), key=lambda pair: pair[1], reverse=True)
        return [
            RetrievedChunk(document=self._docs_by_id[doc_id], score=score)
            for doc_id, score in ranked[:top_k]
        ]

    @staticmethod
    def _document_id_of(record: VectorRecord) -> str:
        """Id del documento padre del registro (cae al id del chunk si falta)."""
        return record.metadata.get("document_id", record.id)

    def __len__(self) -> int:
        return len(self._store)


def build_default_retriever(embedding: EmbeddingProvider | None = None) -> Retriever:
    """Crea un retriever con el corpus por defecto y el embedding mock.

    Si no se pasa un embedding, se ajusta un `BagOfWordsEmbedding` al
    vocabulario del corpus para que la recuperación sea exacta por léxico.
    """
    if embedding is None:
        corpus_texts = [f"{doc.title}. {doc.text}" for doc in DOCUMENTS]
        embedding = BagOfWordsEmbedding(build_vocabulary(corpus_texts))
    return Retriever(embedding)
