"""Selección de proveedores del RAG: mock (aislado) vs reales.

El motor depende de interfaces (`EmbeddingProvider`, `LLMProvider`, un almacén
con `search`). Aquí se eligen las implementaciones concretas según la
configuración:

- `rag_use_mock=True`  → proveedores deterministas, sin llaves ni dependencias
  pesadas (los que ejercitan los tests).
- `rag_use_mock=False` → proveedores reales. Sus dependencias son OPCIONALES
  (`requirements-rag.txt`) y se importan de forma perezosa. Si falta una llave
  o un paquete se lanza `RagProviderError` con un mensaje accionable, en lugar
  de un `ImportError`/`KeyError` opaco.
"""

from __future__ import annotations

from app.config import Settings
from app.rag.db import get_database
from app.rag.embedding_cache import CachedEmbedding
from app.rag.embeddings import EmbeddingProvider, GeminiEmbedding
from app.rag.errors import RagProviderError
from app.rag.llm import AnthropicLLM, GeminiLLM, LLMProvider, OpenAILLM, TemplateLLM
from app.rag.pgvector import PgVectorRetriever
from app.rag.retriever import Retriever, SupportsRetrieve, build_default_retriever


def build_llm_provider(settings: Settings) -> LLMProvider:
    """Devuelve el LLM mock o el real según la configuración."""
    if settings.rag_use_mock:
        return TemplateLLM()

    provider = settings.llm_provider.strip().lower()
    if not provider:
        raise RagProviderError(
            "Define LLM_PROVIDER (openai|anthropic) o usa RAG_USE_MOCK=true."
        )
    if not settings.llm_api_key:
        raise RagProviderError("Falta LLM_API_KEY para el proveedor LLM real.")

    if provider == "openai":
        return OpenAILLM(settings.llm_api_key, settings.llm_model or "gpt-4o-mini")
    if provider == "anthropic":
        return AnthropicLLM(
            settings.llm_api_key,
            settings.llm_model or "claude-haiku-4-5-20251001",
        )
    if provider == "gemini":
        return GeminiLLM(settings.llm_api_key, settings.llm_model or "gemini-2.5-flash")
    raise RagProviderError(
        f"Proveedor LLM no soportado: {provider!r}. "
        "Usa 'openai', 'anthropic' o 'gemini'."
    )


def build_embedding_provider(settings: Settings) -> EmbeddingProvider:
    """Embeddings reales para pgvector. Hoy solo Gemini (reusa `LLM_API_KEY`).

    Se envuelve con caché en disco, caché de consultas y reintentos para no
    gastar cuota de la clave en llamadas repetidas.
    """
    provider = settings.llm_provider.strip().lower()
    if provider != "gemini":
        raise RagProviderError(
            "Los embeddings de pgvector usan Gemini: define LLM_PROVIDER=gemini "
            f"(actual: {provider or 'vacío'!r})."
        )
    if not settings.llm_api_key:
        raise RagProviderError("Falta LLM_API_KEY para los embeddings de Gemini.")
    inner = GeminiEmbedding(
        settings.llm_api_key, settings.embedding_model, settings.embedding_dim
    )
    return CachedEmbedding(
        inner,
        settings.embedding_cache_path,
        model=settings.embedding_model,
        dim=settings.embedding_dim,
    )


def build_retriever(settings: Settings) -> SupportsRetrieve:
    """Devuelve el retriever adecuado según la configuración.

    - Mock: corpus en código + embedding bag-of-words (determinista).
    - Real con `DATABASE_URL`: pgvector + embeddings Gemini.
    - Real sin `DATABASE_URL`: recuperación local sobre los documentos fuente,
      útil para probar un LLM real sin montar la base vectorial.
    """
    if settings.rag_use_mock:
        return build_default_retriever()
    if settings.database_url:
        return _build_pgvector_retriever(settings)
    return _build_local_retriever(settings)


def _build_local_retriever(settings: Settings) -> Retriever:
    """Retriever local (bag-of-words + en memoria) sobre los documentos fuente."""
    from app.rag.embeddings import BagOfWordsEmbedding, build_vocabulary
    from app.rag.ingestion import load_documents

    documents = load_documents(settings.knowledge_sources_dir)
    vocabulary = build_vocabulary([f"{d.title}. {d.text}" for d in documents])
    embedding = BagOfWordsEmbedding(vocabulary)
    return Retriever(
        embedding,
        documents,
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
    )


def _build_pgvector_retriever(settings: Settings) -> PgVectorRetriever:
    """Recuperación con Postgres + pgvector (embeddings Gemini + `match_documents`).

    Requiere el esquema creado por las migraciones (`backend/db/migrations`) y la
    tabla poblada con `./script/dev.sh ingest`. La conexión se abre al primer uso.
    """
    embedding = build_embedding_provider(settings)
    database = get_database(settings)

    def matcher(query_vector: list[float], match_count: int) -> list[dict]:
        return database.match(query_vector, match_count)

    return PgVectorRetriever(embedding, matcher)
