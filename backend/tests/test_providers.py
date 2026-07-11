"""Pruebas del selector de proveedores (mock vs real)."""

import pytest

from app.config import Settings
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


def test_real_without_supabase_uses_local_retriever():
    settings = Settings(rag_use_mock=False, supabase_url="", supabase_service_key="")
    retriever = build_retriever(settings)
    assert isinstance(retriever, Retriever)
    assert len(retriever) >= 7


def test_real_with_supabase_selects_pgvector(monkeypatch):
    import app.rag.providers as providers

    sentinel = object()
    monkeypatch.setattr(providers, "_build_pgvector_retriever", lambda s: sentinel)
    settings = Settings(
        rag_use_mock=False,
        llm_provider="gemini",
        llm_api_key="x",
        supabase_url="https://x.supabase.co",
        supabase_service_key="key",
    )
    assert providers.build_retriever(settings) is sentinel


def test_pgvector_requires_gemini_embeddings():
    # Con Supabase configurado pero un proveedor sin embeddings Gemini, se declina.
    settings = Settings(
        rag_use_mock=False,
        llm_provider="openai",
        llm_api_key="x",
        supabase_url="https://x.supabase.co",
        supabase_service_key="key",
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
    assert isinstance(build_embedding_provider(settings), _FakeProvider)


def test_build_embedding_provider_requires_gemini_and_key():
    with pytest.raises(RagProviderError):  # proveedor != gemini
        build_embedding_provider(
            Settings(rag_use_mock=False, llm_provider="openai", llm_api_key="k")
        )
    with pytest.raises(RagProviderError):  # falta la llave
        build_embedding_provider(
            Settings(rag_use_mock=False, llm_provider="gemini", llm_api_key="")
        )
