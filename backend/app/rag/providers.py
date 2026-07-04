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
from app.rag.llm import AnthropicLLM, GeminiLLM, LLMProvider, OpenAILLM, TemplateLLM
from app.rag.retriever import Retriever, build_default_retriever


class RagProviderError(RuntimeError):
    """Configuración inválida o incompleta de un proveedor real del RAG."""


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


def build_retriever(settings: Settings) -> Retriever:
    """Devuelve el retriever adecuado según la configuración.

    - Mock: corpus en código + embedding bag-of-words (determinista).
    - Real con Supabase configurado: pgvector (pendiente, ver más abajo).
    - Real sin Supabase: recuperación local sobre los documentos fuente, útil
      para probar un LLM real sin montar la base vectorial.
    """
    if settings.rag_use_mock:
        return build_default_retriever()
    if settings.supabase_url and settings.supabase_service_key:
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


def _build_pgvector_retriever(settings: Settings) -> Retriever:
    """Recuperación con Supabase + pgvector. Pendiente de implementar."""
    raise RagProviderError(
        "La recuperación con pgvector aún no está implementada. Pasos: "
        "(1) crear en Supabase la tabla "
        "'documents(content text, metadata jsonb, embedding vector)'; "
        "(2) correr el pipeline de ingesta (app.rag.ingestion) para poblarla; "
        "(3) implementar un almacén que consulte por similitud y enchufarlo al "
        "Retriever. Mientras tanto, deja SUPABASE_URL/SUPABASE_SERVICE_KEY "
        "vacíos para usar recuperación local, o usa RAG_USE_MOCK=true."
    )
