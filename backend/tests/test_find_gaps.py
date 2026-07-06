"""Tests de la lógica pura de `find_gaps` (sin red ni Gemini)."""

from __future__ import annotations

from app.knowledge.entries import STATUS_DRAFT
from app.knowledge.unmsm_ts import MapPlace
from app.rag.find_gaps import (
    build_entry,
    build_generation_prompt,
    gap_places,
    grounding_level,
)


def test_gap_places_diffs_corpus_and_dedups():
    maps = [
        MapPlace(id="a", name="A"),
        MapPlace(id="b", name="B"),
        MapPlace(id="a", name="A duplicado"),
    ]
    gaps = gap_places(maps, corpus_place_ids={"b"})
    assert [g.id for g in gaps] == ["a"]  # b ya está en el corpus; a no se duplica


def test_grounding_level():
    assert grounding_level(MapPlace(id="a", name="A", description="algo")) == "high"
    assert grounding_level(MapPlace(id="a", name="A", careers=("x",))) == "high"
    assert grounding_level(MapPlace(id="a", name="A")) == "low"


def test_prompt_includes_only_present_facts():
    place = MapPlace(id="gim", name="Gimnasio", schedule="Lun 8-20", keywords=("gym",))
    prompt = build_generation_prompt(place)
    assert "Gimnasio" in prompt
    assert "Lun 8-20" in prompt
    assert "Teléfono" not in prompt  # no hay phone -> no se inyecta


def test_build_entry_shape():
    place = MapPlace(id="gim", name="Gimnasio")
    entry = build_entry(place, "Descripción generada.", "gemini-2.5-flash")
    assert entry["place_id"] == "gim"
    assert entry["status"] == STATUS_DRAFT
    assert entry["model"] == "gemini-2.5-flash"
    assert entry["document"] == {
        "id": "doc-gim",
        "title": "Gimnasio",
        "place_id": "gim",
        "text": "Descripción generada.",
    }
