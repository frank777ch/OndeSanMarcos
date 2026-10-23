"""Pruebas del selector de proveedores (mock vs real)."""

import pytest

from app.config import Settings
from app.rag.embedding_cache import CachedEmbedding
from app.rag.llm import TemplateLLM
from app.rag.providers import (
    RagProviderError,
    build_embedding_provider,
    build_llm_provider,
    build_retriever,
)
from app.rag.retriever import Retriever


def test_mock_llm_is_template():
    assert isinstance(build_llm_provider(Settings(rag_use_mock=True)), TemplateLLM)


def test_mock_retriever_is_built():
    assert isinstance(build_retriever(Settings(rag_use_mock=True)), Retriever)


def test_real_without_provider_raises():
    settings = Settings(rag_use_mock=False, llm_provider="")
    with pytest.raises(RagProviderError):
        build_llm_provider(settings)


def test_real_without_api_key_raises():
    settings = Settings(rag_use_mock=False, llm_provider="openai", llm_api_key="")
    with pytest.raises(RagProviderError):
        build_llm_provider(settings)


def test_real_gemini_without_api_key_raises():
    settings = Settings(rag_use_mock=False, llm_provider="gemini", llm_api_key="")
    with pytest.raises(RagProviderError):
        build_llm_provider(settings)


def test_real_unsupported_provider_raises():
    settings = Settings(
        rag_use_mock=False, llm_provider="cohere", llm_api_key="x"
    )
    with pytest.raises(RagProviderError):
        build_llm_provider(settings)


def test_real_without_database_url_uses_local_retriever():
    """RF-23.12: sin DATABASE_URL se mantiene la recuperación local."""
    settings = Settings(rag_use_mock=False, database_url="")
    retriever = build_retriever(settings)
    assert isinstance(retriever, Retriever)
    assert len(retriever) >= 7


def test_real_with_database_url_selects_pgvector(monkeypatch):
    """RF-23.9: con DATABASE_URL se usa pgvector."""
    import app.rag.providers as providers

    sentinel = object()
    monkeypatch.setattr(providers, "_build_pgvector_retriever", lambda s: sentinel)
    settings = Settings(
        rag_use_mock=False,
        llm_provider="gemini",
        llm_api_key="x",
        database_url="postgresql://u:p@localhost:5432/db",
    )
    assert providers.build_retriever(settings) is sentinel


def test_pgvector_requires_gemini_embeddings():
    # Con base configurada pero un proveedor sin embeddings Gemini, se declina.
    settings = Settings(
        rag_use_mock=False,
        llm_provider="openai",
        llm_api_key="x",
        database_url="postgresql://u:p@localhost:5432/db",
    )
    with pytest.raises(RagProviderError):
        build_retriever(settings)


class _FakeProvider:
    """Sustituye a los proveedores reales para no importar SDKs opcionales."""

    def __init__(self, api_key, model=None, dim=None):
        self.api_key = api_key


def test_build_llm_provider_selects_class_per_provider(monkeypatch):
    import app.rag.providers as providers

    monkeypatch.setattr(providers, "OpenAILLM", _FakeProvider)
    monkeypatch.setattr(providers, "AnthropicLLM", _FakeProvider)
    monkeypatch.setattr(providers, "GeminiLLM", _FakeProvider)

    for provider in ("openai", "anthropic", "gemini"):
        settings = Settings(rag_use_mock=False, llm_provider=provider, llm_api_key="k")
        assert isinstance(build_llm_provider(settings), _FakeProvider)


def test_build_embedding_provider_gemini(monkeypatch):
    import app.rag.providers as providers

    monkeypatch.setattr(providers, "GeminiEmbedding", _FakeProvider)
    settings = Settings(rag_use_mock=False, llm_provider="gemini", llm_api_key="k")
    embedding = build_embedding_provider(settings)
    # RF-23.22: se envuelve con la caché; el proveedor real queda dentro.
    assert isinstance(embedding, CachedEmbedding)
    assert isinstance(embedding._inner, _FakeProvider)


def test_build_embedding_provider_requires_gemini_and_key():
    with pytest.raises(RagProviderError):  # proveedor != gemini
        build_embedding_provider(
            Settings(rag_use_mock=False, llm_provider="openai", llm_api_key="k")
        )
    with pytest.raises(RagProviderError):  # falta la llave
        build_embedding_provider(
            Settings(rag_use_mock=False, llm_provider="gemini", llm_api_key="")
        )


def test_mock_retriever_never_opens_the_database(monkeypatch):
    """RF-23.13: en modo mock no se construye ni se abre la base."""
    import app.rag.providers as providers

    def _must_not_be_called(settings):
        raise AssertionError("el modo mock no debe usar la base de datos")

    monkeypatch.setattr(providers, "get_database", _must_not_be_called)
    settings = Settings(rag_use_mock=True, database_url="postgresql://u:p@localhost/db")
    assert isinstance(build_retriever(settings), Retriever)
