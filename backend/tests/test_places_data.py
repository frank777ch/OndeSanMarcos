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


# --- siglas: `short_name` es un dato del lugar, no su slug ---------------------

SHORT_NAMES = {p["slug"]: p["short_name"] for p in SEED["places"] if p.get("short_name")}


def test_las_siglas_conocidas_estan_en_short_name():
    assert SHORT_NAMES["fisi"] == "FISI"
    assert SHORT_NAMES["facultad-de-ciencias-administrativas"] == "FCA"
    assert SHORT_NAMES["facultad-de-ciencias-economicas-nuevo"] == "FCE"
    assert "facultad-de-ciencias-economicas-antiguo" not in SHORT_NAMES  # sin fuente, queda vacía
    assert len(SHORT_NAMES) == 17


def test_ninguna_sigla_se_repite():
    assert len(set(SHORT_NAMES.values())) == len(SHORT_NAMES)


def test_el_nombre_no_repite_la_sigla_entre_parentesis():
    # La card muestra «nombre · sigla»: con la sigla también en el nombre se vería duplicada.
    import re

    assert [p["slug"] for p in SEED["places"] if re.search(r"\([A-ZÁÉÍÓÚÑ0-9]{2,}\)\s*$", p["name"])] == []


def test_toda_sigla_es_buscable_por_el_asistente():
    from app.places.directory import PlaceDirectory, seed_places

    directory = PlaceDirectory(seed_places)
    for slug, sigla in SHORT_NAMES.items():
        assert slug in [p.id for p in directory.find(f"¿horario de la {sigla}?")], sigla
