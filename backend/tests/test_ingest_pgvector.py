"""Tests (con fakes) del re-ingest a pgvector.

Verifica el contrato clave de la Opción A: `ingest()` reconstruye la base con el
corpus **y** las entradas aprobadas (`load_entry_documents`), para que un
re-ingest completo NO borre el conocimiento agregado incrementalmente. Todo con
fakes: sin red, sin base de datos, sin Gemini.
"""

from __future__ import annotations

from app.config import get_settings
from app.knowledge.corpus import Document
from app.rag import ingest_pgvector as ip
from app.rag.errors import RagProviderError
from tests.fake_db import FakeDatabase


class _FakeEmbedding:
    hits = 3
    misses = 2

    def embed_document(self, text: str) -> list[float]:
        return [0.0, 1.0]


def _entry_doc() -> Document:
    return Document(
        id="doc-test-gap",
        title="Lugar de prueba",
        text="Contenido del lugar agregado por upload_entries.",
        place_id="test-gap",
    )


def test_ingest_includes_corpus_and_entries(monkeypatch):
    database = FakeDatabase()
    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _FakeEmbedding())
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [_entry_doc()])

    count = ip.ingest(get_settings(), database=database)

    inserted = database.replaced
    assert inserted is not None
    doc_ids = {row["metadata"]["document_id"] for row in inserted}
    # La entrada incremental está incluida...
    assert "doc-test-gap" in doc_ids
    # ...y también el corpus base (hay más de un documento).
    assert len(doc_ids) > 1
    assert count == len(inserted)
    # Cada fila lleva el embedding del fake.
    assert all(row["embedding"] == [0.0, 1.0] for row in inserted)


def test_ingest_refuses_to_overwrite_without_force(monkeypatch, capsys):
    """RF-23.21: con datos y sin --force no embebe ni toca la tabla."""
    database = FakeDatabase(existing=55)

    def _must_not_be_called(settings):
        raise AssertionError("no debe pedir embeddings (gasta cuota de Gemini)")

    monkeypatch.setattr(ip, "build_embedding_provider", _must_not_be_called)

    assert ip.ingest(get_settings(), database=database) == 0
    assert database.replaced is None
    assert "55" in capsys.readouterr().out


def test_ingest_force_replaces_existing(monkeypatch):
    """RF-23.21: con --force reemplaza aunque haya datos."""
    database = FakeDatabase(existing=55)
    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _FakeEmbedding())
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [])

    assert ip.ingest(get_settings(), force=True, database=database) > 0
    assert database.replaced


def test_ingest_reports_gemini_and_cache_usage(monkeypatch, capsys):
    """RF-23.22: indica cuántos embeddings vinieron de Gemini y cuántos de la caché."""
    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _FakeEmbedding())
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [])

    ip.ingest(get_settings(), database=FakeDatabase())

    out = capsys.readouterr().out
    assert "2 pedidos a Gemini" in out
    assert "3 tomados de la caché" in out


def test_ingest_aborts_without_touching_table_when_embedding_fails(monkeypatch):
    """RF-23.23: si Gemini falla, la tabla queda intacta."""

    class _Failing:
        calls = 0

        def embed_document(self, text: str) -> list[float]:
            _Failing.calls += 1
            if _Failing.calls > 3:
                raise RagProviderError("límite de uso")
            return [0.0, 1.0]

    database = FakeDatabase()
    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _Failing())
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [])

    try:
        ip.ingest(get_settings(), database=database)
    except RagProviderError:
        pass
    else:  # pragma: no cover
        raise AssertionError("debía propagar el error")
    assert database.replaced is None


def test_main_returns_error_code_on_provider_error(monkeypatch, capsys):
    def _boom(*args, **kwargs):
        raise RagProviderError("sin conexión")

    monkeypatch.setattr(ip, "ingest", _boom)
    assert ip.main([]) == 1
    assert "sin conexión" in capsys.readouterr().err
