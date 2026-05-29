"""Pruebas del retriever (ingesta y recuperación por similitud)."""

from app.rag.retriever import build_default_retriever


def test_indexes_the_whole_corpus():
    retriever = build_default_retriever()
    assert len(retriever) >= 7


def test_retrieves_the_relevant_document_first():
    retriever = build_default_retriever()
    top = retriever.retrieve("horario de la biblioteca", top_k=1)
    assert top[0].document.id == "doc-biblioteca"
    assert top[0].score > 0.0


def test_unknown_terms_yield_zero_score():
    retriever = build_default_retriever()
    results = retriever.retrieve("xyzzy zzqq inexistente", top_k=3)
    assert all(chunk.score == 0.0 for chunk in results)
