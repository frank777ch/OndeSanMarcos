"""Tests del modelo de entradas de conocimiento (JSON ↔ Document, filtros)."""

from __future__ import annotations

from app.knowledge.corpus import Document
from app.knowledge.entries import (
    SCHEMA,
    STATUS_APPROVED,
    STATUS_DRAFT,
    STATUS_UPLOADED,
    entry_to_document,
    load_entries_file,
    load_entry_documents,
    save_entries_file,
)


def _entry(place_id: str, status: str) -> dict:
    return {
        "place_id": place_id,
        "status": status,
        "document": {
            "id": f"doc-{place_id}",
            "title": place_id.title(),
            "place_id": place_id,
            "text": "texto de prueba",
        },
    }


def test_entry_to_document():
    doc = entry_to_document(_entry("gimnasio", STATUS_APPROVED))
    assert isinstance(doc, Document)
    assert doc.id == "doc-gimnasio"
    assert doc.place_id == "gimnasio"
    assert doc.text == "texto de prueba"


def test_load_entry_documents_filters_by_status(tmp_path):
    data = {
        "schema": SCHEMA,
        "entries": [
            _entry("a", STATUS_DRAFT),
            _entry("b", STATUS_APPROVED),
            _entry("c", STATUS_UPLOADED),
        ],
    }
    save_entries_file(tmp_path / "e.json", data)
    # Por defecto: aprobadas + subidas (no borradores).
    ids = {d.place_id for d in load_entry_documents(tmp_path)}
    assert ids == {"b", "c"}


def test_load_entry_documents_missing_dir(tmp_path):
    assert load_entry_documents(tmp_path / "no-existe") == []


def test_save_load_roundtrip(tmp_path):
    data = {"schema": SCHEMA, "entries": [_entry("x", STATUS_DRAFT)]}
    save_entries_file(tmp_path / "e.json", data)
    loaded = load_entries_file(tmp_path / "e.json")
    assert loaded["entries"][0]["place_id"] == "x"
