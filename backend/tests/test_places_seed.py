"""HU-22: validación y carga de la semilla de lugares (sin Postgres)."""

import ast
import json
from pathlib import Path

import pytest

from app.places import seed as seed_module
from app.places.seed import (
    SCHEMA,
    Seed,
    SeedError,
    apply_seed,
    load_seed,
    main,
    validate_seed,
)
from app.rag.errors import RagProviderError
from tests.fake_db import FakeDatabase

CATEGORIES = [{"slug": "facultades", "label": "Facultades", "color": "#3056ac", "sort_order": 0}]


def place(**overrides):
    base = {"slug": "fisi", "name": "FISI", "category_slug": "facultades", "lat": -12.05, "lng": -77.08}
    base.update(overrides)
    return base


def make_seed(*places, categories=None):
    return Seed(categories=categories if categories is not None else CATEGORIES, places=list(places))


def test_rf_22_4_blank_texts_become_null_and_lists_default_to_empty():
    seed = validate_seed(make_seed(place(schedule="  ", phone="", description="Hola", keywords=None)))
    row = seed.places[0]
    assert row["schedule"] is None and row["phone"] is None
    assert row["description"] == "Hola"
    assert row["keywords"] == [] and row["careers"] == [] and row["services"] == []


def test_rf_22_4_list_items_are_trimmed_and_blanks_dropped():
    seed = validate_seed(make_seed(place(keywords=[" fisi ", "", "  "])))
    assert seed.places[0]["keywords"] == ["fisi"]


def test_rf_22_7_ids_must_be_unique_slugs():
    with pytest.raises(SeedError, match="Mi Lugar"):
        validate_seed(make_seed(place(slug="Mi Lugar")))
    with pytest.raises(SeedError, match="repetido"):
        validate_seed(make_seed(place(), place()))


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"name": " "}, "nombre"),
        ({"category_slug": "nada"}, "categoría"),
        ({"lat": 200}, "latitud"),
        ({"lng": -181}, "longitud"),
        ({"lat": "x"}, "latitud"),
        ({"keywords": "fisi"}, "keywords"),
        ({"parent_slug": "no-existe"}, "padre"),
        ({"parent_slug": "fisi"}, "padre"),
    ],
)
def test_rf_22_13_invalid_place_names_the_place_and_reason(overrides, message):
    with pytest.raises(SeedError, match=message) as info:
        validate_seed(make_seed(place(**overrides)))
    assert "fisi" in str(info.value)


def test_rf_22_13_invalid_place_cancels_everything_without_touching_the_db():
    db = FakeDatabase()
    bad = make_seed(place(), place(slug="otro", lat=999))
    with pytest.raises(SeedError, match="otro"):
        apply_seed(db, bad)
    assert db.insert_calls == 0 and db.place_rows == {} and db.categories == {}


def test_rf_22_13_invalid_category():
    with pytest.raises(SeedError, match="color"):
        validate_seed(make_seed(categories=[{"slug": "x", "label": "X", "color": "rojo"}]))


def test_rf_22_12_second_run_inserts_nothing_and_keeps_edits():
    db = FakeDatabase()
    seed = make_seed(place(schedule="Lun–Vie"), place(slug="rectorado", name="Rectorado"))
    first = apply_seed(db, seed)
    assert (first.categories_inserted, first.places_inserted, first.places_existing) == (1, 2, 0)

    fisi = next(r for r in db.place_rows.values() if r["slug"] == "fisi")
    ids_before = set(db.place_rows)
    fisi["schedule"] = "Editado a mano"
    second = apply_seed(db, seed)
    assert (second.categories_inserted, second.places_inserted, second.places_existing) == (0, 0, 2)
    assert len(db.place_rows) == 2 and set(db.place_rows) == ids_before  # mismos ids, sin duplicar
    assert fisi["schedule"] == "Editado a mano"


def test_rf_22_6_parents_are_inserted_before_children():
    order = []

    class Recorder(FakeDatabase):
        def insert_places(self, rows):
            order.extend(r["slug"] for r in rows)
            return super().insert_places(rows)

    apply_seed(Recorder(), make_seed(place(slug="hijo", parent_slug="padre"), place(slug="padre")))
    assert order == ["padre", "hijo"]


def test_load_seed_checks_the_schema(tmp_path):
    path = tmp_path / "p.json"
    with pytest.raises(SeedError, match="No existe"):
        load_seed(path)
    path.write_text("{no json", encoding="utf-8")
    with pytest.raises(SeedError, match="JSON"):
        load_seed(path)
    path.write_text(json.dumps({"schema": "otro", "categories": [], "places": []}), encoding="utf-8")
    with pytest.raises(SeedError, match="esquema"):
        load_seed(path)
    path.write_text(json.dumps({"schema": SCHEMA, "categories": CATEGORIES, "places": [place()]}), encoding="utf-8")
    assert len(load_seed(path).places) == 1


def test_rf_22_16_missing_database_url_exits_with_one_line(monkeypatch, tmp_path, capsys):
    path = tmp_path / "p.json"
    path.write_text(json.dumps({"schema": SCHEMA, "categories": CATEGORIES, "places": [place()]}), encoding="utf-8")
    from app.config import get_settings

    monkeypatch.setenv("DATABASE_URL", "")
    get_settings.cache_clear()
    try:
        assert main(["--seed", str(path)]) == 1
    finally:
        get_settings.cache_clear()
    err = capsys.readouterr().err
    assert "DATABASE_URL" in err and "Traceback" not in err


def test_rf_22_16_unreachable_database_exits_with_one(monkeypatch, tmp_path, capsys):
    path = tmp_path / "p.json"
    path.write_text(json.dumps({"schema": SCHEMA, "categories": CATEGORIES, "places": [place()]}), encoding="utf-8")

    class Down:
        def insert_place_categories(self, rows):
            raise RagProviderError("No se pudo conectar a la base de datos.")

    monkeypatch.setattr("app.rag.db.get_database", lambda settings: Down())
    assert main(["--seed", str(path)]) == 1
    assert "No se pudo conectar" in capsys.readouterr().err


def test_scenario_7_seed_does_not_depend_on_knowledge_modules():
    tree = ast.parse(Path(seed_module.__file__).read_text(encoding="utf-8"))
    imported = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            imported.add(node.module)
        elif isinstance(node, ast.Import):
            imported.update(alias.name for alias in node.names)
    assert not [m for m in imported if m.startswith("app.knowledge") or m.startswith("app.tools")]


def test_rf_22_7_the_real_seed_is_valid_with_unique_slugs():
    seed = load_seed()
    validated = validate_seed(seed)
    ids = [p["slug"] for p in validated.places]
    assert len(ids) == len(set(ids)) > 0
    assert len(validated.categories) == 9
