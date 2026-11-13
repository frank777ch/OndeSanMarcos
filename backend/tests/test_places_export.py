"""HU-22: slugs y exportación de la semilla (sin Postgres)."""

import pytest

from app.knowledge.corpus import Document
from app.knowledge.places import CampusPlace, Coordinate
from app.places.seed import Seed, validate_seed
from app.tools.places.export_seed import build_seed
from app.tools.places.slugs import derive_slug, slugify

CATS = [{"id": "facultades", "label": "Facultades", "color": "#3056ac"}]


def web(id, name, **extra):
    base = {"id": id, "name": name, "category": "facultades", "coordinates": [-77.08, -12.05]}
    base.update(extra)
    return base


def backend(id, name, schedule="Lun–Vie 8:00–16:00", keywords=("uno",)):
    return CampusPlace(id=id, name=name, schedule=schedule, keywords=tuple(keywords), coordinate=Coordinate(-12.0, -77.0))


def build(places, backend_places=(), documents=()):
    return build_seed({"categories": CATS, "places": places}, list(backend_places), list(documents))


# --- slugs ---------------------------------------------------------------

def test_slugify_removes_accents_and_symbols():
    assert slugify("Facultad de Ingeniería (Nueva)") == "facultad-de-ingenieria-nueva"
    assert slugify("  Puerta 8 ") == "puerta-8"


def test_rf_22_7_derive_slug_uses_the_sigla_or_the_name_and_avoids_collisions():
    assert derive_slug("Facultad de Ingeniería de Sistemas (FISI)", set()) == "fisi"
    assert derive_slug("Facultad de Ciencias Economicas (Antiguo)", set()) == "facultad-de-ciencias-economicas-antiguo"
    assert derive_slug("Puerta 8", set()) == "puerta-8"
    assert derive_slug("Puerta 8", {"puerta-8"}) == "puerta-8-2"
    assert derive_slug("Puerta 8", {"puerta-8", "puerta-8-2"}) == "puerta-8-3"


# --- exportación ---------------------------------------------------------

def test_rf_22_7_keeps_existing_slugs_and_derives_the_rest_without_collisions():
    seed, id_map, _ = build([web("rectorado", "Rectorado"), web("1", "Puerta 8"), web("2", "Puerta 8 ")])
    ids = [p["slug"] for p in seed["places"]]
    assert "rectorado" in ids and "puerta-8" in ids
    assert len(ids) == len(set(ids))
    assert id_map["rectorado"] == "rectorado"


def test_rf_22_7_derived_slug_does_not_collide_with_a_reserved_slug():
    seed, id_map, _ = build([web("puerta-8", "Otro lugar"), web("1", "Puerta 8")])
    assert id_map["1"] == "puerta-8-2"


def test_rf_22_6_coordinates_are_split_into_lat_and_lng():
    seed, _, _ = build([web("1", "Puerta 1", coordinates=[-77.5, -12.5])])
    assert (seed["places"][0]["lat"], seed["places"][0]["lng"]) == (-12.5, -77.5)


def test_rf_22_8_map_covers_every_web_id():
    raw = [web("1", "A"), web("2", "B"), web("c", "C")]
    _, id_map, _ = build(raw)
    assert set(id_map) == {"1", "2", "c"}


def test_rf_22_9_merges_duplicates_keeping_the_record_with_more_data():
    seed, id_map, report = build(
        [
            web("23", "Facultad de Ingeniería Industrial"),
            web("25", "Facultad de Ingeniería Industrial", schedule="Lun–Sáb", phone="619-7000", careers=["Industrial"]),
        ]
    )
    assert len(seed["places"]) == 1
    assert id_map["23"] == id_map["25"] == seed["places"][0]["slug"]
    assert seed["places"][0]["careers"] == ["Industrial"]
    assert any("23" in line and "25" in line for line in report.merged)


def test_rf_22_10_completes_only_empty_fields_from_places_py_and_the_corpus():
    seed, _, report = build(
        [web("derecho", "Derecho"), web("oca", "OCA", schedule="Web", keywords=["web"], description="Texto web")],
        [backend("derecho", "Derecho", "Lun–Sáb", ["leyes"]), backend("oca", "OCA", "Backend", ["backend"])],
        [Document(id="d", title="t", text="Texto del corpus", place_id="derecho"),
         Document(id="o", title="t", text="No debe usarse", place_id="oca")],
    )
    derecho, oca = {p["slug"]: p for p in seed["places"]}["derecho"], {p["slug"]: p for p in seed["places"]}["oca"]
    assert derecho["schedule"] == "Lun–Sáb" and derecho["keywords"] == ["leyes"]
    assert derecho["description"] == "Texto del corpus"
    # La web gana cuando ya trae el valor.
    assert (oca["schedule"], oca["keywords"], oca["description"]) == ("Web", ["web"], "Texto web")
    assert any("derecho" in line for line in report.completed)


def test_rf_22_14_report_lists_merged_completed_differences_and_backend_only():
    _, _, report = build(
        [web("a", "A", schedule="X"), web("1", "B"), web("2", "B")],
        [backend("a", "A", "Y", ["uno"]), backend("solo", "Solo backend")],
    )
    text = "\n".join(report.lines())
    assert report.exported == 2
    assert report.merged and report.differences and report.only_in_backend == ["solo"]
    assert "Fusionados: 1" in text and "Solo en places.py" in text


def test_exported_seed_passes_the_loader_validation():
    seed, _, _ = build([web("1", "Puerta 8"), web("fisi", "FISI", schedule="Lun")])
    validate_seed(Seed(categories=seed["categories"], places=seed["places"]))
