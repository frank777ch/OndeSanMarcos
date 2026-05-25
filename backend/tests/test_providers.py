"""Pruebas del selector de proveedores (mock vs real)."""

import pytest

from app.config import Settings
from app.rag.llm import TemplateLLM
from app.rag.providers import (
    RagProviderError,
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


def test_real_with_supabase_pgvector_pending():
    settings = Settings(
        rag_use_mock=False,
        supabase_url="https://x.supabase.co",
        supabase_service_key="key",
    )
    with pytest.raises(RagProviderError):
        build_retriever(settings)
