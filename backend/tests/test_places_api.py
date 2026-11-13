"""HU-27: API pública de lugares y categorías (base en memoria)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.caching import _matches, make_etag
from app.api.places import get_places_store
from app.main import create_app
from app.rag.errors import RagProviderError
from tests.fake_db import FakeDatabase
from tests.fake_places_admin import cid

PUBLIC_FIELDS = {
    "id", "slug", "name", "short_name", "category_id", "lat", "lng", "keywords", "description",
    "schedule", "detailed_schedule", "phone", "annex", "email", "website", "access_hint",
    "careers", "services", "usage", "image_url", "parent_place_id", "is_published",
    "verified_at", "updated_at",
}
# Cada lugar de prueba tiene un id numérico estable; su slug es el nombre estandarizado.
_IDS = {"puerta-1": 1, "rectorado": 2, "fisi": 3, "oculto": 4}


def pid(slug):
    return _IDS.setdefault(slug, len(_IDS) + 1)


ENDPOINTS = ["/api/place-categories", "/api/places", f"/api/places/{pid('fisi')}"]


def place(slug, name, category="facultades", **extra):
    return {"id": pid(slug), "slug": slug, "name": name, "category_id": cid(category), "lat": -12.05, "lng": -77.08, **extra}


@pytest.fixture
def store():
    db = FakeDatabase()
    db.categories = {
        cid("puertas"): {"id": cid("puertas"), "slug": "puertas", "label": "Puertas", "color": "#e74c3c", "sort_order": 4},
        cid("facultades"): {"id": cid("facultades"), "slug": "facultades", "label": "Facultades", "color": "#3056ac", "sort_order": 0},
    }
    db.place_rows = {
        pid("puerta-1"): place("puerta-1", "Puerta 1", "puertas"),
        pid("rectorado"): place("rectorado", "Rectorado", "administracion", schedule="Lun–Vie"),
        pid("fisi"): place(
            "fisi", "Facultad de Sistemas", keywords=["fisi"], careers=["Software"],
            phone="619-7000", created_at="2026-01-01", updated_by="admin",
        ),
        pid("oculto"): place("oculto", "Lugar oculto", is_published=False),
    }
    return db


@pytest.fixture
def client(store):
    app = create_app()
    app.dependency_overrides[get_places_store] = lambda: store
    return TestClient(app)


def test_rf_27_1_categories_have_id_label_color_and_follow_sort_order(client):
    r = client.get("/api/place-categories")
    assert r.status_code == 200
    assert r.json() == [
        {"id": cid("facultades"), "slug": "facultades", "label": "Facultades", "color": "#3056ac"},
        {"id": cid("puertas"), "slug": "puertas", "label": "Puertas", "color": "#e74c3c"},
    ]


def test_rf_27_2_list_has_every_field_of_the_card(client):
    r = client.get("/api/places")
    assert r.status_code == 200
    assert all(set(p) == PUBLIC_FIELDS for p in r.json())
    fisi = next(p for p in r.json() if p["slug"] == "fisi")
    assert fisi["keywords"] == ["fisi"] and fisi["careers"] == ["Software"] and fisi["phone"] == "619-7000"


def test_rf_27_3_does_not_expose_created_at_or_updated_by(client):
    for url in ("/api/places", f"/api/places/{pid('fisi')}"):
        text = client.get(url).text
        assert "created_at" not in text and "updated_by" not in text
        assert '"admin"' not in text


def test_rf_27_4_sorted_by_name_with_empty_lists_and_nulls(client):
    names = [p["name"] for p in client.get("/api/places").json()]
    assert names == sorted(names)
    puerta = next(p for p in client.get("/api/places").json() if p["slug"] == "puerta-1")
    assert puerta["keywords"] == [] and puerta["detailed_schedule"] == []
    assert puerta["careers"] == [] and puerta["services"] == []
    assert puerta["schedule"] is None and puerta["email"] is None and puerta["verified_at"] is None
    assert client.get("/api/places").json() == client.get("/api/places").json()


def test_rf_27_5_filters_by_category_and_unknown_category_is_empty(client):
    r = client.get("/api/places", params={"category": cid("puertas")})
    assert [p["slug"] for p in r.json()] == ["puerta-1"]
    unknown = client.get("/api/places", params={"category": 987654})
    assert unknown.status_code == 200 and unknown.json() == []
    assert client.get("/api/places", params={"category": "puertas"}).status_code == 422  # el filtro es el id


def test_rf_27_6_detail_has_the_same_fields_as_the_list(client):
    r = client.get(f"/api/places/{pid('fisi')}")
    assert r.status_code == 200
    assert set(r.json()) == PUBLIC_FIELDS
    assert r.json() == next(p for p in client.get("/api/places").json() if p["slug"] == "fisi")


@pytest.mark.parametrize("place_id", ["999", "4", "0", "-1", "1.5", "fisi", "Mi%20Lugar", "%E0%A5%A6", "9" * 300])
def test_rf_27_7_missing_hidden_and_invalid_ids_give_the_same_404(client, place_id):
    reference = client.get("/api/places/999")
    r = client.get(f"/api/places/{place_id}")
    assert r.status_code == 404
    assert r.json() == reference.json() == {"detail": "Lugar no encontrado."}


def test_rf_27_8_hidden_place_is_not_in_list_filter_or_detail(client):
    assert "oculto" not in [p["slug"] for p in client.get("/api/places").json()]
    assert client.get("/api/places", params={"category": cid("facultades")}).json() != []
    assert "oculto" not in [p["slug"] for p in client.get("/api/places", params={"category": cid("facultades")}).json()]
    assert client.get(f"/api/places/{pid('oculto')}").status_code == 404


@pytest.mark.parametrize("url", ENDPOINTS)
def test_rf_27_9_same_response_without_token_with_garbage_and_with_a_real_token(client, url):
    from app.auth.tokens import create_access_token
    from app.config import get_settings

    settings = get_settings()
    token, _ = create_access_token("admin", settings.jwt_secret, settings.access_token_expire_minutes)
    anonymous = client.get(url)
    garbage = client.get(url, headers={"Authorization": "Bearer basura"})
    valid = client.get(url, headers={"Authorization": f"Bearer {token}"})
    assert anonymous.status_code == garbage.status_code == valid.status_code == 200
    assert anonymous.content == garbage.content == valid.content


@pytest.mark.parametrize("url", ENDPOINTS)
def test_rf_27_10_cache_control_and_etag(client, url):
    r = client.get(url)
    assert r.headers["cache-control"] == "public, max-age=60"
    assert r.headers["etag"] == make_etag(r.content)


@pytest.mark.parametrize("url", ENDPOINTS)
def test_rf_27_11_matching_if_none_match_gives_304_without_body(client, url):
    etag = client.get(url).headers["etag"]
    r = client.get(url, headers={"If-None-Match": etag})
    assert r.status_code == 304 and r.content == b""
    assert r.headers["etag"] == etag and r.headers["cache-control"] == "public, max-age=60"


def test_rf_27_11_changed_content_gives_200_and_a_new_etag(client, store):
    first = client.get("/api/places")
    store.place_rows[pid("fisi")]["schedule"] = "Cambiado"
    second = client.get("/api/places", headers={"If-None-Match": first.headers["etag"]})
    assert second.status_code == 200
    assert second.headers["etag"] != first.headers["etag"]


def test_rf_27_11_if_none_match_accepts_list_weak_prefix_and_star():
    etag = '"abc"'
    assert _matches('"x", "abc"', etag)
    assert _matches('W/"abc"', etag)
    assert _matches("*", etag)
    assert not _matches('"otro"', etag)
    assert not _matches(None, etag)


def test_rf_27_12_empty_tables_give_200_and_empty_lists():
    app = create_app()
    app.dependency_overrides[get_places_store] = lambda: FakeDatabase()
    client = TestClient(app)
    assert client.get("/api/places").json() == []
    assert client.get("/api/place-categories").json() == []
    assert client.get("/api/places").status_code == 200


@pytest.mark.parametrize("url", ENDPOINTS)
def test_rf_27_13_database_down_gives_503_with_a_message(url):
    class Down:
        def _fail(self, *args, **kwargs):
            raise RagProviderError("No se pudo conectar a la base de datos.")

        list_place_categories = list_places = get_place = _fail

    app = create_app()
    app.dependency_overrides[get_places_store] = lambda: Down()
    r = TestClient(app).get(url)
    assert r.status_code == 503 and "base de datos" in r.json()["detail"]


def test_rf_27_15_openapi_documents_the_three_endpoints_under_places(client):
    spec = client.get("/openapi.json").json()
    for path in ("/api/places", "/api/places/{place_id}", "/api/place-categories"):
        op = spec["paths"][path]["get"]
        assert op["tags"] == ["places"]
        assert "304" in op["responses"] and "503" in op["responses"]
    props = spec["components"]["schemas"]["PlaceOut"]["properties"]
    assert set(props) == PUBLIC_FIELDS
    assert all(props[f].get("description") for f in props)
    assert "404" in spec["paths"]["/api/places/{place_id}"]["get"]["responses"]


# --- HU-36: búsqueda ---------------------------------------------------------


@pytest.fixture
def search_client(store):
    store.place_rows.update(
        {
            pid("biblioteca"): place("biblioteca", "Biblioteca Central", "servicios", keywords=["libros", "estudio"]),
            pid("psicologia"): place("psicologia", "Facultad de Psicología", short_name="Psicología"),
            pid("fisi-lab"): place("fisi-lab", "Laboratorio de la FISI Norte"),
            pid("oculto-lab"): place("oculto-lab", "Laboratorio oculto", is_published=False),
        }
    )
    store.place_rows[pid("fisi")]["short_name"] = "FISI"
    app = create_app()
    app.dependency_overrides[get_places_store] = lambda: store
    return TestClient(app)


def names(response):
    return [p["name"] for p in response.json()]


def test_rf_36_1_search_is_public_and_returns_place_fields(search_client):
    r = search_client.get("/api/places/search", params={"q": "biblioteca"})
    assert r.status_code == 200
    assert all(set(p) == PUBLIC_FIELDS for p in r.json())
    assert names(r) == ["Biblioteca Central"]


def test_rf_36_2_only_published_places(search_client):
    assert names(search_client.get("/api/places/search", params={"q": "laboratorio"})) == [
        "Laboratorio de la FISI Norte"
    ]


def test_rf_36_3_ignores_case_and_accents_and_looks_at_acronym_and_keywords(search_client):
    assert "Facultad de Psicología" in names(search_client.get("/api/places/search", params={"q": "PSICOLOGIA"}))
    assert names(search_client.get("/api/places/search", params={"q": "estudio"})) == ["Biblioteca Central"]
    assert "Facultad de Sistemas" in names(search_client.get("/api/places/search", params={"q": "fisi"}))


def test_rf_36_4_exact_acronym_comes_before_names_that_contain_it(search_client):
    assert names(search_client.get("/api/places/search", params={"q": "fisi"})) == [
        "Facultad de Sistemas",  # sigla exacta (nivel 0)
        "Laboratorio de la FISI Norte",  # el nombre lo contiene (nivel 2)
    ]
    assert names(search_client.get("/api/places/search", params={"q": "facultad"}))[0] == "Facultad de Psicología"


def test_rf_36_5_tolerates_typos(search_client):
    assert names(search_client.get("/api/places/search", params={"q": "bibliotca"})) == ["Biblioteca Central"]


def test_rf_36_6_query_length_rules(search_client):
    assert search_client.get("/api/places/search", params={"q": "b"}).json() == []
    assert search_client.get("/api/places/search", params={"q": "  b "}).json() == []
    assert search_client.get("/api/places/search", params={"q": "x" * 101}).status_code == 422
    assert search_client.get("/api/places/search").status_code == 422


def test_rf_36_7_limit(search_client, store):
    for i in range(12):
        store.place_rows[pid(f"lab-{i}")] = place(f"lab-{i}", f"Laboratorio {i:02d}")
    assert len(search_client.get("/api/places/search", params={"q": "laboratorio"}).json()) == 8
    assert len(search_client.get("/api/places/search", params={"q": "laboratorio", "limit": 3}).json()) == 3
    assert search_client.get("/api/places/search", params={"q": "laboratorio", "limit": 21}).status_code == 422
    assert search_client.get("/api/places/search", params={"q": "laboratorio", "limit": 0}).status_code == 422


def test_rf_36_8_no_matches_is_an_empty_list(search_client):
    r = search_client.get("/api/places/search", params={"q": "zzzzzz"})
    assert r.status_code == 200 and r.json() == []


def test_rf_36_9_has_etag_and_answers_304(search_client):
    r = search_client.get("/api/places/search", params={"q": "biblioteca"})
    assert r.headers["cache-control"] == "public, max-age=60"
    again = search_client.get("/api/places/search", params={"q": "biblioteca"}, headers={"If-None-Match": r.headers["etag"]})
    assert again.status_code == 304


def test_rf_36_10_database_down_gives_503(store):
    def boom(*a, **k):
        raise RagProviderError("No se pudo conectar a la base de datos.")

    store.search_places = boom
    app = create_app()
    app.dependency_overrides[get_places_store] = lambda: store
    r = TestClient(app).get("/api/places/search", params={"q": "biblioteca"})
    assert r.status_code == 503 and "base de datos" in r.json()["detail"]


def test_rf_36_11_search_is_not_taken_for_a_place_id(search_client, store):
    store.place_rows[pid("search")] = place("search", "Lugar con slug search")
    assert search_client.get("/api/places/search", params={"q": "lugar"}).status_code == 200
    assert isinstance(search_client.get("/api/places/search", params={"q": "lugar"}).json(), list)
    assert search_client.get("/api/places/search").status_code == 422  # no es el detalle de un lugar


def test_rf_36_12_documented_in_openapi(search_client):
    op = search_client.get("/openapi.json").json()["paths"]["/api/places/search"]["get"]
    assert {p["name"] for p in op["parameters"]} == {"q", "limit"}
    assert all(p.get("description") for p in op["parameters"])
