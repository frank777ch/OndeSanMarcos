"""Test de integración (con fakes) del re-ingest a pgvector.

Verifica el contrato clave de la Opción A: `ingest()` reconstruye la base con el
corpus **y** las entradas aprobadas (`load_entry_documents`), para que un
re-ingest completo NO borre el conocimiento agregado incrementalmente. Todo con
fakes: sin red, sin Supabase, sin Gemini.
"""

from __future__ import annotations

from app.config import get_settings
from app.knowledge.corpus import Document
from app.rag import ingest_pgvector as ip


class _FakeEmbedding:
    def embed_document(self, text: str) -> list[float]:
        return [0.0, 1.0]


class _FakeQuery:
    def __init__(self, sink: list[dict]):
        self._sink = sink

    def delete(self):
        return self

    def neq(self, *args):
        return self

    def insert(self, rows):
        self._sink.extend(rows)
        return self

    def execute(self):
        return None


class _FakeClient:
    def __init__(self, sink: list[dict]):
        self._sink = sink

    def table(self, name):
        return _FakeQuery(self._sink)


def test_ingest_includes_corpus_and_entries(monkeypatch):
    inserted: list[dict] = []
    entry_doc = Document(
        id="doc-test-gap",
        title="Lugar de prueba",
        text="Contenido del lugar agregado por upload_entries.",
        place_id="test-gap",
    )

    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _FakeEmbedding())
    monkeypatch.setattr(ip, "_build_client", lambda settings: _FakeClient(inserted))
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [entry_doc])

    count = ip.ingest(get_settings())

    doc_ids = {row["metadata"]["document_id"] for row in inserted}
    # La entrada incremental está incluida...
    assert "doc-test-gap" in doc_ids
    # ...y también el corpus base (hay más de un documento).
    assert len(doc_ids) > 1
    assert count == len(inserted)
    # Cada fila lleva el embedding del fake.
    assert all(row["embedding"] == [0.0, 1.0] for row in inserted)
