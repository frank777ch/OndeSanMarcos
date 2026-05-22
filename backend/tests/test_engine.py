"""Pruebas del motor RAG (pipeline completo en modo mock)."""

import pytest

from app.rag import guardrails
from app.rag.engine import NO_INFO_MESSAGE, build_engine


@pytest.fixture
def engine():
    return build_engine()


def test_answer_is_grounded_and_returns_location(engine):
    result = engine.answer("¿a qué hora abre la biblioteca?")
    assert "biblioteca" in result.answer.lower()
    assert any(loc.id == "biblioteca-central" for loc in result.locations)


def test_out_of_scope_query_is_declined(engine):
    result = engine.answer("dame una receta de ceviche")
    assert result.answer == guardrails.OUT_OF_SCOPE_MESSAGE
    assert result.locations == []


def test_in_scope_without_data_returns_no_info(engine):
    # "matricula" es del dominio (in-scope) pero no hay documento ni lugar.
    result = engine.answer("cómo hago mi matrícula")
    assert result.answer == NO_INFO_MESSAGE
    assert result.locations == []


def test_query_with_keyword_detects_place(engine):
    result = engine.answer("quiero almorzar en el comedor")
    assert any(loc.id == "comedor-universitario" for loc in result.locations)
