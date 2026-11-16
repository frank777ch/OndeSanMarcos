"""HU-29: `places.json` es la única fuente inicial de los lugares (sin Postgres)."""

import json
from pathlib import Path

from app.knowledge.corpus import DOCUMENTS
from app.knowledge.entries import DEFAULT_ENTRIES_DIR
from app.places.seed import load_seed, validate_seed

SEED = json.loads((Path(__file__).resolve().parents[1] / "db" / "seed" / "places.json").read_text(encoding="utf-8"))
SLUGS = [p["slug"] for p in SEED["places"]]


def test_la_semilla_pasa_la_validacion_de_la_carga():
    validate_seed(load_seed())


def test_rf_29_3_todo_slug_de_la_semilla_es_unico():
    assert len(SLUGS) == len(set(SLUGS))


def test_rf_29_1_ningun_documento_del_corpus_lleva_place_id():
    assert [d.id for d in DOCUMENTS if d.place_id] == []


def test_rf_29_3_todo_place_id_de_las_entradas_existe_en_la_semilla():
    ids = set()
    for file in DEFAULT_ENTRIES_DIR.glob("*.json"):
        for entry in json.loads(file.read_text(encoding="utf-8")).get("entries", []):
            ids.add(entry["place_id"])
            ids.add(entry["document"]["place_id"])
    assert ids - set(SLUGS) == set()


def test_rf_29_2_la_informacion_del_corpus_quedo_en_la_descripcion_del_lugar():
    by_slug = {p["slug"]: p for p in SEED["places"]}
    assert "carné" in by_slug["biblioteca-central"]["description"]
    assert "pabellón nuevo" in by_slug["facultad-de-ciencias-economicas-nuevo"]["description"]
    # «Antiguo» y «Nuevo» son facultades distintas: la información no se copia al Antiguo.
    assert "pabellón nuevo" not in by_slug["facultad-de-ciencias-economicas-antiguo"]["description"]
    assert by_slug["rectorado"]["description"]
