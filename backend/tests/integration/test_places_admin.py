"""HU-30: administración de lugares contra Postgres real."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.api.admin_places import get_admin_places_store
from app.api.places import get_places_store
from app.auth.dependencies import get_store
from app.auth.tokens import create_access_token
from app.config import get_settings
from app.main import create_app
from app.places.seed import apply_seed, load_seed
from app.rag.db import Database
from tests.fake_admin import FakeAdminStore

pytestmark = pytest.mark.integration
SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres"


def place(**extra):
    return {"name": "Laboratorio de Redes", "category_id": 1, "lat": -12.0535, "lng": -77.0857, **extra}


@pytest.fixture
def api(test_database_url, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", SECRET)
    get_settings.cache_clear()
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate places, place_categories restart identity cascade")
    database = Database(test_database_url)
    apply_seed(database, load_seed())
    admins = FakeAdminStore()
    admins.admins["admin"] = "hash"
    app = create_app()
    app.dependency_overrides[get_store] = lambda: admins
    app.dependency_overrides[get_admin_places_store] = lambda: database
    app.dependency_overrides[get_places_store] = lambda: database
    client = TestClient(app)
    token, _ = create_access_token("admin", SECRET, 60)
    client.headers["Authorization"] = f"Bearer {token}"
    try:
        yield client, test_database_url
    finally:
        database.close()
        get_settings.cache_clear()


def _fisi(url) -> int:
    return _count(url, "select id from places where slug = 'fisi'")


def _count(url, query="select count(*) from places"):
    with psycopg.connect(url) as conn:
        return conn.execute(query).fetchone()[0]


def test_rf_30_6_created_place_shows_in_the_public_api(api):
    client, url = api
    total = _count(url)
    r = client.post("/api/admin/places", json=place())
    assert r.status_code == 201 and r.json()["id"] == total + 1  # sigue a los de la semilla
    assert r.json()["slug"] == "laboratorio-de-redes"
    assert client.get(f"/api/places/{total + 1}").json()["name"] == "Laboratorio de Redes"
    assert total + 1 in [p["id"] for p in client.get("/api/places").json()]
    again = client.post("/api/admin/places", json=place()).json()
    assert again["slug"] == "laboratorio-de-redes-2"  # el slug no se repite


def test_rf_30_8_ids_grow_even_with_concurrent_creations(api):
    client, url = api
    total = _count(url)
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda _: client.post("/api/admin/places", json=place()), range(12)))
    ids = [r.json()["id"] for r in results]
    assert all(r.status_code == 201 for r in results)
    assert len(set(ids)) == 12 and min(ids) == total + 1
    assert len({r.json()["slug"] for r in results}) == 12  # ni siquiera con creaciones simultáneas
    assert client.post("/api/admin/places", json=place()).json()["id"] == max(ids) + 1


def test_rf_30_11_verified_sets_keeps_and_clears(api):
    client, _ = api
    pid = client.post("/api/admin/places", json=place()).json()["id"]
    assert client.get(f"/api/admin/places/{pid}").json()["verified_at"] is None
    first = client.put(f"/api/admin/places/{pid}", json=place(verified=True)).json()["verified_at"]
    second = client.put(f"/api/admin/places/{pid}", json=place(verified=True, phone="1")).json()["verified_at"]
    assert first is not None and second == first
    assert client.put(f"/api/admin/places/{pid}", json=place(verified=False)).json()["verified_at"] is None


def test_rf_30_10_audit_fields(api):
    client, url = api
    pid = client.post("/api/admin/places", json=place()).json()["id"]
    created = client.get(f"/api/admin/places/{pid}").json()
    edited = client.put(f"/api/admin/places/{pid}", json=place(name="Otro")).json()
    assert created["updated_by"] == "admin" and edited["updated_by"] == "admin"
    assert edited["created_at"] == created["created_at"] and edited["updated_at"] > created["updated_at"]


def test_rf_30_13_parent_and_cycles_with_real_foreign_keys(api):
    client, url = api
    a = client.post("/api/admin/places", json=place(name="A")).json()["id"]
    b = client.post("/api/admin/places", json=place(name="B", parent_place_id=a)).json()["id"]
    c = client.post("/api/admin/places", json=place(name="C", parent_place_id=b)).json()["id"]
    r = client.put(f"/api/admin/places/{a}", json=place(name="A", parent_place_id=c))
    assert r.status_code == 422 and "parent_place_id" in str(r.json())
    assert client.put(f"/api/admin/places/{a}", json=place(name="A", parent_place_id=a)).status_code == 422
    assert client.post("/api/admin/places", json=place(parent_place_id="no-existe")).status_code == 422
    assert client.get(f"/api/admin/places/{a}").json()["parent_place_id"] is None


def test_rf_30_16_unpublish_and_republish(api):
    client, url = api
    fisi = _fisi(url)
    client.put(f"/api/admin/places/{fisi}", json=place(name="FISI", is_published=False))
    assert client.get(f"/api/places/{fisi}").status_code == 404
    assert fisi not in [p["id"] for p in client.get("/api/places").json()]
    assert fisi in [p["id"] for p in client.get("/api/admin/places", params={"published": "false"}).json()]
    client.put(f"/api/admin/places/{fisi}", json=place(name="FISI", is_published=True))
    assert client.get(f"/api/places/{fisi}").status_code == 200


def test_rf_30_4_q_without_accents_or_case(api):
    client, url = api
    ids = [p["id"] for p in client.get("/api/admin/places", params={"q": "INGENIERIA"}).json()]
    assert _fisi(url) in ids  # «Ingeniería de Sistemas e Informática»
    assert client.get("/api/admin/places", params={"q": "zzzz-no"}).json() == []


def test_rf_30_21_category_lifecycle_with_real_data(api):
    client, _ = api
    r = client.post("/api/admin/place-categories", json={"label": "Laboratorios", "color": "#112233"})
    assert r.status_code == 201 and r.json()["sort_order"] == 9 and r.json()["places_count"] == 0
    cat = r.json()["id"]
    assert r.json()["slug"] == "laboratorios" and cat == 10
    again = client.post("/api/admin/place-categories", json={"label": "Laboratorios", "color": "#112233"}).json()
    assert again["slug"] == "laboratorios-2" and again["id"] == cat + 1  # sin choques de slug
    assert "laboratorios" in [c["slug"] for c in client.get("/api/place-categories").json()]  # RF-30.22
    pid = client.post("/api/admin/places", json=place(category_id=cat)).json()["id"]
    client.put(f"/api/admin/places/{pid}", json=place(category_id=cat, is_published=False))
    blocked = client.delete(f"/api/admin/place-categories/{cat}")
    assert blocked.status_code == 409 and "1 lugar" in blocked.json()["detail"]
    client.put(f"/api/admin/places/{pid}", json=place(category_id=1))
    assert client.delete(f"/api/admin/place-categories/{cat}").status_code == 204
    assert client.delete(f"/api/admin/place-categories/{cat}").status_code == 404
    assert client.delete("/api/admin/place-categories/laboratorios").status_code == 422


def test_hu_39_concurrent_category_creations_get_distinct_slugs(api):
    client, _ = api
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(
            lambda _: client.post("/api/admin/place-categories", json={"label": "Taller", "color": "#112233"}), range(8)
        ))
    assert all(r.status_code == 201 for r in results)
    assert len({r.json()["slug"] for r in results}) == 8


def test_rf_30_27_a_failed_validation_leaves_nothing_behind(api):
    client, url = api
    before = _count(url)
    assert client.post("/api/admin/places", json=place(category_id=987654)).status_code == 422
    assert client.post("/api/admin/places", json=place(email="x")).status_code == 422
    assert _count(url) == before
    # La base misma impide un dato inválido aunque la API fallara: el CHECK de coordenadas.
    with psycopg.connect(url) as conn, pytest.raises(psycopg.errors.CheckViolation):
        conn.execute(
            "insert into places (slug, name, category_id, lat, lng) values ('malo','M', 1, 99, 0)"
        )


def test_rf_30_26_change_is_visible_in_the_public_api_right_away(api):
    client, url = api
    fisi = _fisi(url)
    client.put(f"/api/admin/places/{fisi}", json=place(name="Nombre nuevo"))
    assert client.get(f"/api/places/{fisi}").json()["name"] == "Nombre nuevo"
    assert client.get(f"/api/places/{fisi}").json()["slug"] == "fisi"  # el slug no cambia al renombrar
