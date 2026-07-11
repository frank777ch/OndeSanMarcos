"""Tests de la lógica pura de `upload_entries` (sin red ni Supabase)."""

from __future__ import annotations

from app.config import get_settings
from app.knowledge.corpus import Document
from app.knowledge.entries import (
    SCHEMA,
    STATUS_APPROVED,
    STATUS_DRAFT,
    STATUS_UPLOADED,
    load_entries_file,
    save_entries_file,
)
from app.rag import upload_entries as ue
from app.rag.upload_entries import _rows_for_document, _uploadable


def _entry(status) -> dict:
    return {"place_id": "x", "status": status, "document": {}}


def test_uploadable_status_logic():
    # Aprobada -> se sube; ya subida -> nunca se re-sube.
    assert _uploadable(_entry(STATUS_APPROVED), approve_all=False) is True
    assert _uploadable(_entry(STATUS_UPLOADED), approve_all=True) is False
    # Borrador: solo si approve_all.
    assert _uploadable(_entry(STATUS_DRAFT), approve_all=False) is False
    assert _uploadable(_entry(STATUS_DRAFT), approve_all=True) is True
    # Sin status: no subible.
    assert _uploadable({"status": None}, approve_all=True) is False


class _FakeEmbedding:
    """Embedding determinista sin red (misma interfaz que GeminiEmbedding)."""

    def embed_document(self, text: str) -> list[float]:
        return [0.5, 0.5]


def test_rows_for_document_shape():
    doc = Document(
        id="doc-gimnasio",
        title="Gimnasio",
        text="El gimnasio del campus ofrece pesas y clases.",
        place_id="gimnasio",
    )
    rows = _rows_for_document(doc, _FakeEmbedding(), get_settings())

    assert len(rows) >= 1
    first = rows[0]
    assert first["content"]
    assert first["metadata"] == {
        "document_id": "doc-gimnasio",
        "place_id": "gimnasio",
        "title": "Gimnasio",
        "position": 0,
    }
    assert first["embedding"] == [0.5, 0.5]


class _FakeResult:
    count = 0
    data: list = []


class _FakeQuery:
    """Soporta las cadenas de PostgREST que usa upload_entries (con fakes)."""

    def __init__(self, sink: list[dict]):
        self._sink = sink

    def select(self, *args, **kwargs):
        return self

    def filter(self, *args, **kwargs):
        return self

    def delete(self):
        return self

    def insert(self, rows):
        self._sink.extend(rows)
        return self

    def execute(self):
        return _FakeResult()


class _FakeClient:
    def __init__(self, sink: list[dict]):
        self._sink = sink

    def table(self, name):
        return _FakeQuery(self._sink)


def _approved_file(tmp_path):
    entry = {
        "place_id": "gimnasio",
        "status": STATUS_APPROVED,
        "document": {
            "id": "doc-gimnasio",
            "title": "Gimnasio",
            "place_id": "gimnasio",
            "text": "El gimnasio del campus ofrece pesas y clases.",
        },
    }
    path = tmp_path / "entries.json"
    save_entries_file(path, {"schema": SCHEMA, "entries": [entry]})
    return path


def test_main_uploads_approved_entry(tmp_path, monkeypatch):
    inserted: list[dict] = []
    path = _approved_file(tmp_path)
    monkeypatch.setattr(ue, "_supabase_client", lambda settings: _FakeClient(inserted))
    monkeypatch.setattr(ue, "build_embedding_provider", lambda settings: _FakeEmbedding())

    rc = ue.main(["--file", str(path)])

    assert rc == 0
    assert len(inserted) >= 1  # nueva (no existía) -> insertó
    saved = load_entries_file(path)
    assert saved["entries"][0]["status"] == STATUS_UPLOADED


def test_main_dry_run_uploads_nothing(tmp_path, monkeypatch):
    inserted: list[dict] = []
    path = _approved_file(tmp_path)
    monkeypatch.setattr(ue, "_supabase_client", lambda settings: _FakeClient(inserted))
    monkeypatch.setattr(ue, "build_embedding_provider", lambda settings: _FakeEmbedding())

    rc = ue.main(["--file", str(path), "--dry-run"])

    assert rc == 0
    assert inserted == []  # dry-run no inserta
    saved = load_entries_file(path)
    assert saved["entries"][0]["status"] == STATUS_APPROVED  # sin cambios
