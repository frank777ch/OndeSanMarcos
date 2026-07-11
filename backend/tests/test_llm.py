"""Tests del LLM mock y del armado de prompts (sin red)."""

from __future__ import annotations

from app.rag.llm import TemplateLLM, build_prompt


def test_build_prompt_includes_query_and_contexts():
    prompt = build_prompt(
        "¿dónde está la biblioteca?",
        ["La biblioteca está en la Plaza Cívica.", "   "],
    )
    assert "¿dónde está la biblioteca?" in prompt
    assert "La biblioteca está en la Plaza Cívica." in prompt


def test_template_llm_returns_top_context():
    llm = TemplateLLM()
    assert llm.generate("q", ["  primer fragmento  ", "segundo"]) == "primer fragmento"


def test_template_llm_without_context_declines():
    llm = TemplateLLM()
    out = llm.generate("q", ["", "   "])
    assert "no tengo" in out.lower()
