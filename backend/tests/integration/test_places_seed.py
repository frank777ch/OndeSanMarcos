"""HU-22: carga de la semilla real contra Postgres."""

import psycopg
import pytest

from app.places.seed import apply_seed, load_seed
from app.rag.db import Database

pytestmark = pytest.mark.integration


@pytest.fixture
def seeded(test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate places, place_categories cascade")
    database = Database(test_database_url)
    try:
        yield database, test_database_url
    finally:
        database.close()


def _one(url, query, *args):
    with psycopg.connect(url) as conn:
        return conn.execute(query, args).fetchone()


def test_rf_22_5_loads_the_nine_categories(seeded):
    database, url = seeded
    seed = load_seed()
    result = apply_seed(database, seed)
    assert result.categories_inserted == 9
    ids = {r[0] for r in psycopg.connect(url).execute("select id from place_categories").fetchall()}
    assert ids == {"facultades", "cafeterias", "auditorios", "campos-deportivos", "puertas",
                   "administracion", "salud", "servicios", "otros"}


def test_rf_22_6_loads_every_place_of_the_seed_with_lat_and_lng(seeded):
    database, url = seeded
    seed = load_seed()
    result = apply_seed(database, seed)
    assert result.places_inserted == len(seed.places) > 0
    assert _one(url, "select count(*) from places")[0] == len(seed.places)
    lat, lng = _one(url, "select lat, lng from places where id = 'fisi'")
    assert -13 < lat < -11 and -78 < lng < -76


def test_scenario_2_full_card_of_a_place(seeded):
    database, url = seeded
    apply_seed(database, load_seed())
    name, category, keywords, schedule, careers = _one(
        url, "select name, category_id, keywords, schedule, careers from places where id = 'fisi'"
    )
    assert "Sistemas" in name and category == "facultades"
    assert "fisi" in keywords and schedule and careers


def test_rf_22_11_nothing_is_verified_after_the_load(seeded):
    database, url = seeded
    apply_seed(database, load_seed())
    assert _one(url, "select count(*) from places where verified_at is not null")[0] == 0


def test_rf_22_12_running_twice_does_not_duplicate_or_overwrite_edits(seeded):
    database, url = seeded
    seed = load_seed()
    apply_seed(database, seed)
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("update places set schedule = 'Editado a mano' where id = 'fisi'")
    second = apply_seed(database, seed)
    assert (second.categories_inserted, second.places_inserted) == (0, 0)
    assert second.places_existing == len(seed.places)
    assert _one(url, "select count(*) from places")[0] == len(seed.places)
    assert _one(url, "select schedule from places where id = 'fisi'")[0] == "Editado a mano"


def test_scenario_3_duplicates_are_one_place_and_the_map_is_complete():
    import json
    from pathlib import Path

    seed_dir = Path(__file__).resolve().parents[2] / "db" / "seed"
    id_map = json.loads((seed_dir / "place_id_map.json").read_text(encoding="utf-8"))
    slugs = {p["id"] for p in load_seed().places}
    assert id_map["23"] == id_map["25"]
    assert [p for p in load_seed().places if "Industrial" in p["name"] and p["id"] == id_map["23"]]
    assert set(id_map.values()) <= slugs
    assert {str(n) for n in range(1, 41)} <= set(id_map)
