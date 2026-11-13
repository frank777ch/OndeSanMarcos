"""HU-30: administración de lugares y categorías (base en memoria)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.api.admin_places import get_admin_places_store
from app.api.places import get_places_store
from app.auth.dependencies import get_store
from app.auth.tokens import create_access_token
from app.config import get_settings
from app.main import create_app
from app.places.sync import get_place_sync
from app.rag.errors import RagProviderError
from tests.fake_admin import FakeAdminStore
from tests.fake_db import FakeDatabase

SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres"


class SpySync:
    def __init__(self, result="ok", fail=False):
        self.calls: list[str] = []
        self.result = result
        self.fail = fail

    def sync(self, place_id):
        self.calls.append(place_id)
        if self.fail:
            raise RuntimeError("embeddings caídos")
        return self.result


def base_place(**extra):
    return {"name": "Laboratorio de Redes", "category_id": "facultades", "lat": -12.0535, "lng": -77.0857, **extra}


@pytest.fixture(autouse=True)
def secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", SECRET)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def db():
    d = FakeDatabase()
    d.categories = {
        "facultades": {"id": "facultades", "label": "Facultades", "color": "#3056ac", "sort_order": 0},
        "puertas": {"id": "puertas", "label": "Puertas", "color": "#e74c3c", "sort_order": 1},
    }
    d.place_rows = {
        "fisi": {"id": "fisi", "name": "Facultad de Sistemas", "short_name": "FISI", "category_id": "facultades",
                 "lat": -12.0535, "lng": -77.0857, "keywords": ["informática"], "updated_by": "otro"},
        "puerta-3": {"id": "puerta-3", "name": "Puerta 3", "category_id": "puertas", "lat": -12.057, "lng": -77.08,
                     "is_published": False},
    }
    return d


@pytest.fixture
def sync():
    return SpySync()


@pytest.fixture
def client(db, sync):
    admins = FakeAdminStore()
    admins.admins["admin"] = "hash"
    app = create_app()
    app.dependency_overrides[get_store] = lambda: admins
    app.dependency_overrides[get_admin_places_store] = lambda: db
    app.dependency_overrides[get_places_store] = lambda: db
    app.dependency_overrides[get_place_sync] = lambda: sync
    c = TestClient(app)
    token, _ = create_access_token("admin", SECRET, 60)
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.fixture
def anon(client):
    c = TestClient(client.app)
    return c


def errors(response):
    return {e["loc"][-1]: e["msg"] for e in response.json()["detail"]}


ADMIN_URLS = [
    ("get", "/api/admin/places"), ("get", "/api/admin/places/fisi"), ("post", "/api/admin/places"),
    ("put", "/api/admin/places/fisi"), ("post", "/api/admin/places/fisi/reindex"),
    ("get", "/api/admin/place-categories"), ("post", "/api/admin/place-categories"),
    ("put", "/api/admin/place-categories/puertas"), ("delete", "/api/admin/place-categories/puertas"),
]


def test_rf_30_1_without_token_altered_or_expired_gives_401(anon, db):
    expired, _ = create_access_token("admin", SECRET, 60, now=datetime.now(timezone.utc) - timedelta(days=1))
    tokens = [None, "alterado", expired]
    for method, url in ADMIN_URLS:
        for token in tokens:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            r = getattr(anon, method)(url, headers=headers, **({"json": {}} if method in ("post", "put") else {}))
            assert r.status_code == 401, (method, url, token)
            assert r.headers["www-authenticate"] == "Bearer"
    assert "1000" not in db.place_rows


def test_rf_30_2_admin_responses_are_never_cached(client, anon):
    assert client.get("/api/admin/places").headers["cache-control"] == "no-store"
    assert anon.get("/api/admin/places").headers["cache-control"] == "no-store"
    assert client.post("/api/admin/places", json={}).headers["cache-control"] == "no-store"
    assert client.get("/api/places").headers["cache-control"] != "no-store"


def test_rf_30_3_list_has_hidden_places_and_internal_fields(client):
    r = client.get("/api/admin/places")
    assert r.status_code == 200
    rows = r.json()
    assert [p["id"] for p in rows] == ["fisi", "puerta-3"]
    assert rows[0]["updated_by"] == "otro" and "created_at" in rows[0]
    assert rows[1]["is_published"] is False


def test_rf_30_4_filters_combine(client, db):
    db.place_rows["puerta-2"] = {"id": "puerta-2", "name": "Puerta 2", "category_id": "puertas",
                                 "lat": -12.059, "lng": -77.079, "verified_at": datetime(2026, 1, 1, tzinfo=timezone.utc)}
    ids = lambda **p: [x["id"] for x in client.get("/api/admin/places", params=p).json()]  # noqa: E731
    assert ids(category="puertas") == ["puerta-2", "puerta-3"]
    assert ids(published="false") == ["puerta-3"]
    assert ids(verified="true") == ["puerta-2"]
    assert ids(verified="false", category="puertas") == ["puerta-3"]
    assert ids(q="INFORMATICA") == ["fisi"]
    assert ids(q="fi") == ["fisi"]
    assert ids(q="puerta 3") == ["puerta-3"]
    assert ids(q="puerta-3") == ["puerta-3"]


def test_rf_30_5_detail_even_if_hidden_and_404(client):
    assert client.get("/api/admin/places/puerta-3").status_code == 200
    assert client.get("/api/admin/places/nada").status_code == 404


def test_rf_30_6_creates_with_201_and_location_and_shows_in_public_api(client, sync):
    r = client.post("/api/admin/places", json=base_place())
    assert r.status_code == 201
    body = r.json()
    assert r.headers["location"] == f"/api/admin/places/{body['id']}"
    assert body["id"] == "1000" and body["rag_sync"] == "ok"
    assert [p["id"] for p in client.get("/api/places").json() if p["id"] == "1000"] == ["1000"]
    assert client.get("/api/places/1000").status_code == 200
    assert sync.calls == ["1000"]


def test_rf_30_7_required_fields_and_defaults(client):
    r = client.post("/api/admin/places", json={"name": "X"})
    assert r.status_code == 422
    assert {"category_id", "lat", "lng"} <= set(errors(r))
    ok = client.post("/api/admin/places", json=base_place()).json()
    assert ok["is_published"] is True and ok["verified_at"] is None and ok["keywords"] == []


def test_rf_30_8_ids_are_incremental_and_id_in_body_is_rejected(client):
    a = client.post("/api/admin/places", json=base_place()).json()["id"]
    b = client.post("/api/admin/places", json=base_place()).json()["id"]
    assert (a, b) == ("1000", "1001")
    r = client.post("/api/admin/places", json=base_place(id="fisi"))
    assert r.status_code == 422 and "id" in errors(r)


def test_rf_30_9_put_replaces_everything_and_id_is_fixed(client):
    r = client.put("/api/admin/places/fisi", json=base_place(name="Nuevo nombre"))
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "fisi" and body["name"] == "Nuevo nombre"
    assert body["keywords"] == [] and body["short_name"] is None
    assert client.put("/api/admin/places/fisi", json=base_place(id="otro")).status_code == 422
    assert client.put("/api/admin/places/nada", json=base_place()).status_code == 404


def test_rf_30_10_updated_by_and_unknown_audit_fields_rejected(client):
    body = client.post("/api/admin/places", json=base_place()).json()
    assert body["updated_by"] == "admin"
    for field in ("created_at", "updated_by", "updated_at", "verified_at"):
        assert client.post("/api/admin/places", json=base_place(**{field: "x"})).status_code == 422


def test_rf_30_11_verified_sets_keeps_and_clears(client):
    first = client.put("/api/admin/places/fisi", json=base_place(verified=True)).json()["verified_at"]
    assert first is not None
    second = client.put("/api/admin/places/fisi", json=base_place(verified=True)).json()["verified_at"]
    assert second == first
    assert client.put("/api/admin/places/fisi", json=base_place(verified=False)).json()["verified_at"] is None


def test_rf_30_12_edit_without_changes_still_ok_and_updates_audit(client, db):
    client.put("/api/admin/places/fisi", json=base_place())
    before = db.place_rows["fisi"]["updated_at"]
    r = client.put("/api/admin/places/fisi", json=base_place())
    assert r.status_code == 200 and db.place_rows["fisi"]["updated_at"] >= before
    assert db.place_rows["fisi"]["updated_by"] == "admin"


@pytest.mark.parametrize(
    "field,value",
    [
        ("name", ""), ("name", "x" * 201), ("lat", 40), ("lng", -70), ("lat", "no"),
        ("category_id", "inexistente"), ("email", "x"), ("website", "javascript:alert(1)"),
        ("image_url", "ftp://x.com/a.png"), ("description", "x" * 5001), ("phone", "x" * 301),
        ("parent_place_id", "no-existe"), ("keywords", "no es lista"), ("careers", [f"c{i}" for i in range(51)]),
    ],
)
def test_rf_30_13_invalid_data_names_the_field_and_saves_nothing(client, db, field, value):
    before = dict(db.place_rows)
    r = client.post("/api/admin/places", json=base_place(**{field: value}))
    assert r.status_code == 422
    assert field in errors(r)
    assert db.place_rows == before


def test_rf_30_13_parent_cannot_be_itself_or_form_a_cycle(client, db):
    r = client.put("/api/admin/places/fisi", json=base_place(parent_place_id="fisi"))
    assert r.status_code == 422 and "parent_place_id" in errors(r)
    assert client.put("/api/admin/places/puerta-3", json=base_place(parent_place_id="fisi")).status_code == 200
    r = client.put("/api/admin/places/fisi", json=base_place(parent_place_id="puerta-3"))
    assert r.status_code == 422 and "ciclo" in errors(r)["parent_place_id"]


def test_rf_30_14_trims_empties_and_dedupes_lists(client):
    r = client.post(
        "/api/admin/places",
        json=base_place(name="  Lab  ", phone="   ", keywords=[" Red ", "red", "", "Wifi"], services=[]),
    ).json()
    assert r["name"] == "Lab" and r["phone"] is None
    assert r["keywords"] == ["Red", "Wifi"]


def test_rf_30_15_unknown_field_is_rejected(client):
    r = client.post("/api/admin/places", json=base_place(colour="rojo"))
    assert r.status_code == 422 and "colour" in errors(r)


def test_rf_30_16_unpublish_hides_from_public_api_but_not_from_admin(client):
    client.put("/api/admin/places/fisi", json=base_place(is_published=False))
    assert client.get("/api/places/fisi").status_code == 404
    assert "fisi" not in [p["id"] for p in client.get("/api/places").json()]
    assert [p["id"] for p in client.get("/api/admin/places", params={"published": "false"}).json()].count("fisi") == 1
    client.put("/api/admin/places/fisi", json=base_place(is_published=True))
    assert client.get("/api/places/fisi").status_code == 200


def test_rf_30_17_places_cannot_be_deleted(client, db):
    r = client.delete("/api/admin/places/fisi")
    assert r.status_code == 405
    assert "fisi" in db.place_rows


def test_rf_30_18_categories_with_count_including_hidden(client):
    rows = {c["id"]: c for c in client.get("/api/admin/place-categories").json()}
    assert rows["puertas"]["places_count"] == 1 and rows["facultades"]["places_count"] == 1
    assert list(rows) == ["facultades", "puertas"]


def test_rf_30_19_create_category_duplicate_and_default_order(client):
    r = client.post("/api/admin/place-categories", json={"id": "labs", "label": "Laboratorios", "color": "#112233"})
    assert r.status_code == 201 and r.json()["sort_order"] == 2
    assert r.headers["location"] == "/api/admin/place-categories/labs"
    dup = client.post("/api/admin/place-categories", json={"id": "labs", "label": "X", "color": "#112233"})
    assert dup.status_code == 409
    bad = client.post("/api/admin/place-categories", json={"id": "Bad Id", "label": "", "color": "rojo"})
    assert bad.status_code == 422 and {"id", "label", "color"} <= set(errors(bad))


def test_rf_30_20_update_category_keeps_id_and_404(client):
    r = client.put("/api/admin/place-categories/puertas", json={"label": "Accesos", "color": "#000000", "sort_order": 5})
    assert r.status_code == 200 and r.json()["id"] == "puertas" and r.json()["label"] == "Accesos"
    assert client.put("/api/admin/place-categories/x", json={"label": "A", "color": "#000000"}).status_code == 404
    assert client.put("/api/admin/place-categories/puertas", json={"id": "z", "label": "A", "color": "#000000"}).status_code == 422


def test_rf_30_21_delete_category_only_when_empty(client, db):
    r = client.delete("/api/admin/place-categories/puertas")
    assert r.status_code == 409 and "1 lugar" in r.json()["detail"]
    db.categories["vacia"] = {"id": "vacia", "label": "V", "color": "#111111", "sort_order": 9}
    assert client.delete("/api/admin/place-categories/vacia").status_code == 204
    assert client.delete("/api/admin/place-categories/vacia").status_code == 404


def test_rf_30_22_category_changes_show_in_public_api(client, db):
    client.post("/api/admin/place-categories", json={"id": "labs", "label": "Laboratorios", "color": "#112233"})
    from app.api.places import get_places_store  # noqa: F401

    assert "labs" in [c["id"] for c in client.get("/api/place-categories").json()]


def test_rf_30_23_create_edit_and_unpublish_sync_after_saving(client, sync):
    client.post("/api/admin/places", json=base_place())
    client.put("/api/admin/places/fisi", json=base_place())
    client.put("/api/admin/places/fisi", json=base_place(is_published=False))
    assert sync.calls == ["1000", "fisi", "fisi"]


def test_rf_30_24_sync_failure_keeps_the_change_and_is_reported(client, db, sync, caplog):
    sync.fail = True
    with caplog.at_level(logging.ERROR):
        r = client.post("/api/admin/places", json=base_place())
    assert r.status_code == 201 and r.json()["rag_sync"] == "failed"
    assert "1000" in db.place_rows
    assert "embeddings caídos" in caplog.text


def test_rf_30_24_skipped_without_assistant():
    # Implementación por defecto: sin asistente conectado.
    from app.places.sync import NullPlaceSync

    assert NullPlaceSync().sync("x") == "skipped"


def test_rf_30_25_reindex_repeats_sync_and_404(client, sync):
    r = client.post("/api/admin/places/fisi/reindex")
    assert r.status_code == 200 and r.json()["rag_sync"] == "ok" and sync.calls == ["fisi"]
    assert client.post("/api/admin/places/nada/reindex").status_code == 404


def test_rf_30_28_database_down_gives_503(client, db):
    def boom(*a, **k):
        raise RagProviderError("No se pudo conectar a la base de datos.")

    db.admin_list_places = boom
    db.create_category = boom
    r = client.get("/api/admin/places")
    assert r.status_code == 503 and "base de datos" in r.json()["detail"]
    assert r.headers["cache-control"] == "no-store"
    assert client.post("/api/admin/place-categories", json={"id": "a", "label": "A", "color": "#111111"}).status_code == 503


def test_rf_30_29_openapi_has_tags_security_and_descriptions(client):
    spec = client.get("/openapi.json").json()
    tags = {t for path in spec["paths"].values() for op in path.values() for t in op.get("tags", [])}
    assert {"admin-places", "admin-place-categories"} <= tags
    op = spec["paths"]["/api/admin/places"]["post"]
    assert op["security"]
    props = spec["components"]["schemas"]["PlaceIn"]["properties"]
    assert all(p.get("description") for p in props.values())


def test_rf_30_30_log_has_admin_and_id_but_no_text(client, caplog):
    with caplog.at_level(logging.INFO, logger="app.places.service"):
        client.post("/api/admin/places", json=base_place(description="TEXTO SECRETO LARGO"))
    assert "id=1000" in caplog.text and "por=admin" in caplog.text
    assert "TEXTO SECRETO" not in caplog.text and "Laboratorio" not in caplog.text
