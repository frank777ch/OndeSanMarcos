"""Recuperación de contexto: ingesta del corpus y búsqueda top-k.

El `Retriever` indexa los documentos (embeddings → vector store) y, dada una
consulta, devuelve los fragmentos más relevantes. Es el equivalente aislado
del índice que en producción gestionará LlamaIndex sobre pgvector.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from app.knowledge.corpus import DOCUMENTS, Document
from app.rag.embeddings import (
    BagOfWordsEmbedding,
    EmbeddingProvider,
    build_vocabulary,
)
from app.rag.vector_store import InMemoryVectorStore, VectorRecord


@dataclass(frozen=True)
class RetrievedChunk:
    """Documento recuperado junto con su puntaje de similitud."""

    document: Document
    score: float


class Retriever:
    """Indexa documentos y recupera los más relevantes por consulta."""

    def __init__(
        self,
        embedding: EmbeddingProvider,
        documents: Iterable[Document] | None = None,
    ) -> None:
        self._embedding = embedding
        self._store = InMemoryVectorStore()
        self._docs_by_id: dict[str, Document] = {}
        for document in DOCUMENTS if documents is None else documents:
            self.add_document(document)

    def add_document(self, document: Document) -> None:
        """Vectoriza e indexa un documento (título + texto)."""
        vector = self._embedding.embed(f"{document.title}. {document.text}")
        self._store.add(
            VectorRecord(
                id=document.id,
                text=document.text,
                vector=vector,
                metadata={"place_id": document.place_id, "title": document.title},
            )
        )
        self._docs_by_id[document.id] = document

    def retrieve(self, query: str, top_k: int = 4) -> list[RetrievedChunk]:
        """Devuelve los `top_k` documentos más relevantes para la consulta."""
        query_vector = self._embedding.embed(query)
        results = self._store.search(query_vector, top_k)
        return [
            RetrievedChunk(document=self._docs_by_id[record.id], score=score)
            for record, score in results
        ]

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
