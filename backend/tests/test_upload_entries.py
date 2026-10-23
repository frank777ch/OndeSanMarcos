"""Tests de la lógica pura de `upload_entries` (sin red ni base de datos)."""

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
from tests.fake_db import FakeDatabase


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


def _run(monkeypatch, path, database, *args):
    monkeypatch.setattr(ue, "get_database", lambda settings: database)
    monkeypatch.setattr(ue, "build_embedding_provider", lambda settings: _FakeEmbedding())
    return ue.main(["--file", str(path), *args])


def test_main_uploads_approved_entry(tmp_path, monkeypatch):
    """RF-23.11: inserta los fragmentos de un lugar nuevo."""
    database = FakeDatabase()
    path = _approved_file(tmp_path)

    rc = _run(monkeypatch, path, database)

    assert rc == 0
    assert len(database.place_replacements["gimnasio"]) >= 1
    saved = load_entries_file(path)
    assert saved["entries"][0]["status"] == STATUS_UPLOADED


def test_main_dry_run_uploads_nothing(tmp_path, monkeypatch):
    database = FakeDatabase()
    path = _approved_file(tmp_path)

    rc = _run(monkeypatch, path, database, "--dry-run")

    assert rc == 0
    assert database.place_replacements == {}  # dry-run no escribe
    saved = load_entries_file(path)
    assert saved["entries"][0]["status"] == STATUS_APPROVED  # sin cambios


def test_main_skips_existing_place_without_update_flag(tmp_path, monkeypatch):
    """RF-23.11: un lugar ya presente no se pisa sin --update-existing."""
    database = FakeDatabase(places={"gimnasio": 3})
    path = _approved_file(tmp_path)

    rc = _run(monkeypatch, path, database)

    assert rc == 0
    assert database.place_replacements == {}
    assert load_entries_file(path)["entries"][0]["status"] == STATUS_APPROVED


def test_main_replaces_existing_place_with_update_flag(tmp_path, monkeypatch):
    """RF-23.11: con --update-existing reemplaza los fragmentos del lugar."""
    database = FakeDatabase(places={"gimnasio": 3})
    path = _approved_file(tmp_path)

    rc = _run(monkeypatch, path, database, "--update-existing")

    assert rc == 0
    assert len(database.place_replacements["gimnasio"]) >= 1
    assert load_entries_file(path)["entries"][0]["status"] == STATUS_UPLOADED
