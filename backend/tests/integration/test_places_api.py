"""HU-27: API de lugares contra Postgres real con la semilla de HU-22."""

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.api.places import get_places_store
from app.main import create_app
from app.places.seed import apply_seed, load_seed
from app.rag.db import Database

pytestmark = pytest.mark.integration


@pytest.fixture
def api(test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate places, place_categories cascade")
    database = Database(test_database_url)
    seed = load_seed()
    apply_seed(database, seed)
    app = create_app()
    app.dependency_overrides[get_places_store] = lambda: database
    try:
        yield TestClient(app), database, test_database_url, len(seed.places)
    finally:
        database.close()


def test_scenario_1_lists_every_place_sorted_without_internal_fields(api):
    client, _, url, total = api
    r = client.get("/api/places")
    assert r.status_code == 200
    places = r.json()
    assert len(places) == total
    with psycopg.connect(url) as conn:
        expected = [row[0] for row in conn.execute("select name from places order by name, id").fetchall()]
    assert [p["name"] for p in places] == expected
    assert all("created_at" not in p and "updated_by" not in p for p in places)
    assert client.get("/api/places").content == r.content  # RF-27.4: orden estable


def test_scenario_2_nine_categories_in_order(api):
    client, *_ = api
    categories = client.get("/api/place-categories").json()
    assert len(categories) == 9
    assert categories[0]["id"] == "facultades"
    assert all(set(c) == {"id", "label", "color"} for c in categories)


def test_scenario_3_filter_by_category(api):
    client, *_ = api
    doors = client.get("/api/places", params={"category": "puertas"}).json()
    assert doors and all(p["category_id"] == "puertas" for p in doors)
    assert client.get("/api/places", params={"category": "no-existe"}).json() == []


def test_scenario_4_detail_and_404(api):
    client, *_ = api
    fisi = client.get("/api/places/fisi")
    assert fisi.status_code == 200
    body = fisi.json()
    assert body["id"] == "fisi" and body["careers"] and body["verified_at"] is None
    missing = client.get("/api/places/no-existe")
    invalid = client.get("/api/places/Mi%20Lugar")
    assert missing.status_code == invalid.status_code == 404
    assert missing.json() == invalid.json()


def test_scenario_5_unpublished_place_disappears_everywhere(api):
    client, _, url, total = api
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("update places set is_published = false where id = 'fisi'")
    assert "fisi" not in [p["id"] for p in client.get("/api/places").json()]
    assert len(client.get("/api/places").json()) == total - 1
    assert "fisi" not in [p["id"] for p in client.get("/api/places", params={"category": "facultades"}).json()]
    assert client.get("/api/places/fisi").status_code == 404


def test_scenario_6_etag_changes_when_a_schedule_changes(api):
    client, _, url, _ = api
    first = client.get("/api/places")
    assert client.get("/api/places", headers={"If-None-Match": first.headers["etag"]}).status_code == 304
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("update places set schedule = 'Lun–Dom 24h' where id = 'fisi'")
    again = client.get("/api/places", headers={"If-None-Match": first.headers["etag"]})
    assert again.status_code == 200 and again.headers["etag"] != first.headers["etag"]


def test_rf_27_14_each_query_method_runs_a_single_statement(api):
    _, database, _, _ = api
    counts = []
    real = database.connection

    class Spy:
        def __init__(self, conn):
            self._conn = conn
            self.n = 0

        def execute(self, *args, **kwargs):
            self.n += 1
            return self._conn.execute(*args, **kwargs)

    from contextlib import contextmanager

    @contextmanager
    def spied():
        with real() as conn:
            spy = Spy(conn)
            yield spy
            counts.append(spy.n)

    database.connection = spied  # type: ignore[method-assign]
    database.list_place_categories()
    database.list_places()
    database.list_places("puertas")
    database.get_place("fisi")
    assert counts == [1, 1, 1, 1]


# --- HU-36: búsqueda con pg_trgm y unaccent ----------------------------------


def _search(client, q, **extra):
    r = client.get("/api/places/search", params={"q": q, **extra})
    assert r.status_code == 200
    return r.json()


def test_rf_36_5_search_tolerates_typos_in_real_postgres(api):
    client, *_ = api
    names = [p["name"] for p in _search(client, "bibliotca")]
    assert any("iblioteca" in n for n in names), names


def test_rf_36_3_search_ignores_accents_and_case_in_real_postgres(api):
    client, *_ = api
    assert "fisi" in [p["id"] for p in _search(client, "INGENIERIA DE SISTEMAS")]
    assert [p["id"] for p in _search(client, "ingeniería", limit=20)] == [
        p["id"] for p in _search(client, "INGENIERIA", limit=20)
    ]
    assert len(_search(client, "INGENIERIA")) == 8


def test_rf_36_4_exact_acronym_comes_first_in_real_postgres(api):
    client, *_ = api
    assert _search(client, "fisi")[0]["id"] == "fisi"


def test_rf_36_2_unpublished_places_are_not_found_in_real_postgres(api):
    client, database, url, _ = api
    assert "fisi" in [p["id"] for p in _search(client, "fisi")]
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("update places set is_published = false where id = 'fisi'")
    assert "fisi" not in [p["id"] for p in _search(client, "fisi")]


def test_rf_36_7_search_limit_and_short_queries_in_real_postgres(api):
    client, *_ = api
    assert len(_search(client, "facultad")) == 8
    assert len(_search(client, "facultad", limit=3)) == 3
    assert _search(client, "f") == []
    assert _search(client, "zzzzqq") == []


def test_rf_36_5_noise_is_not_returned_for_unrelated_text(api):
    client, *_ = api
    assert _search(client, "xqzwv") == []
