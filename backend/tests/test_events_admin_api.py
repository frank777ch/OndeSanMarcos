"""Administración de eventos (base en memoria)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.api.admin_events import get_admin_events_store
from app.api.admin_places import get_admin_places_store
from app.api.events import get_events_store
from app.auth.dependencies import get_store
from app.auth.tokens import create_access_token
from app.config import get_settings
from app.events.sync import get_event_sync
from app.main import create_app
from tests.fake_admin import FakeAdminStore
from tests.fake_db import FakeDatabase
from tests.fake_places_admin import cid

SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres"
FUTURE = datetime.now(timezone.utc) + timedelta(days=3)


class SpySync:
    def __init__(self, result="ok", fail=False):
        self.calls: list[int] = []
        self.removed: list[str] = []
        self.result = result
        self.fail = fail

    def sync(self, event_id):
        self.calls.append(event_id)
        if self.fail:
            raise RuntimeError("embeddings caídos")
        return self.result

    def remove(self, slug):
        if self.fail:
            raise RuntimeError("embeddings caídos")
        self.removed.append(slug)
        return self.result


def body(**extra):
    return {"title": "Feria de Ciencias", "starts_at": FUTURE.isoformat(), **extra}


@pytest.fixture(autouse=True)
def secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", SECRET)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def db():
    d = FakeDatabase()
    d.categories = {cid("servicios"): {"id": cid("servicios"), "slug": "servicios", "label": "Servicios", "color": "#3056ac"}}
    d.place_rows = {7: {"id": 7, "slug": "auditorio", "name": "Auditorio", "category_id": cid("servicios"), "lat": -12.05, "lng": -77.08}}
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
    app.dependency_overrides[get_admin_events_store] = lambda: db
    app.dependency_overrides[get_admin_places_store] = lambda: db
    app.dependency_overrides[get_events_store] = lambda: db
    app.dependency_overrides[get_event_sync] = lambda: sync
    c = TestClient(app)
    token, _ = create_access_token("admin", SECRET, 60)
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.fixture
def anon(client):
    return TestClient(client.app)


def errors(response):
    return {e["loc"][-1]: e["msg"] for e in response.json()["detail"]}


URLS = [
    ("get", "/api/admin/events"), ("get", "/api/admin/events/1"), ("post", "/api/admin/events"),
    ("put", "/api/admin/events/1"), ("delete", "/api/admin/events/1"), ("post", "/api/admin/events/1/reindex"),
]


@pytest.mark.parametrize(("method", "url"), URLS)
def test_sin_sesion_es_401(anon, method, url):
    assert getattr(anon, method)(url).status_code == 401


# --- crear ------------------------------------------------------------------


def test_crear_asigna_id_y_slug_y_sincroniza(client, sync):
    r = client.post("/api/admin/events", json=body(place_id=7, organizer="Facultad X", is_free=True))
    assert r.status_code == 201
    data = r.json()
    assert data["id"] == 1 and data["slug"].startswith("feria-de-ciencias-")
    assert data["place_id"] == 7 and data["updated_by"] == "admin" and data["rag_sync"] == "ok"
    assert r.headers["Location"] == "/api/admin/events/1"
    assert sync.calls == [1]


def test_los_valores_por_defecto(client):
    data = client.post("/api/admin/events", json=body()).json()
    assert (data["category"], data["status"], data["modality"], data["is_published"]) == ("otro", "scheduled", "in_person", True)
    assert data["place_id"] is None and data["is_free"] is None and data["agenda"] == []


def test_una_fecha_sin_zona_se_toma_como_hora_de_lima(client):
    data = client.post("/api/admin/events", json=body(starts_at="2026-11-22T10:00:00")).json()
    assert data["starts_at"].endswith("-05:00") and "10:00:00" in data["starts_at"]


def test_el_texto_se_limpia_y_las_listas_no_repiten(client):
    data = client.post("/api/admin/events", json=body(
        title="  Charla  ", organizer="   ", agenda=["10:00 Inicio", " 10:00 inicio ", ""], keywords=["IA", "ia"],
    )).json()
    assert data["title"] == "Charla" and data["organizer"] is None
    assert data["agenda"] == ["10:00 Inicio"] and data["keywords"] == ["IA"]


@pytest.mark.parametrize(
    ("extra", "campo"),
    [
        ({"title": ""}, "title"),
        ({"ends_at": (FUTURE - timedelta(hours=1)).isoformat()}, "ends_at"),
        ({"place_id": 999}, "place_id"),
        ({"category": "zzz"}, "category"),
        ({"status": "zzz"}, "status"),
        ({"modality": "zzz"}, "modality"),
        ({"website": "ftp://x"}, "website"),
        ({"image_url": "javascript:alert(1)"}, "image_url"),
        ({"registration_url": "no-es-url"}, "registration_url"),
        ({"online_url": "x"}, "online_url"),
        ({"email": "no-es-correo"}, "email"),
        ({"description": "x" * 5001}, "description"),
        ({"agenda": "no es lista"}, "agenda"),
    ],
)
def test_validaciones_nombran_el_campo(client, sync, extra, campo):
    r = client.post("/api/admin/events", json=body(**extra))
    assert r.status_code == 422
    assert campo in errors(r)
    assert sync.calls == []


def test_falta_el_titulo_o_la_fecha_y_no_se_aceptan_campos_ajenos(client):
    assert client.post("/api/admin/events", json={"starts_at": FUTURE.isoformat()}).status_code == 422
    assert client.post("/api/admin/events", json={"title": "x"}).status_code == 422
    assert client.post("/api/admin/events", json=body(id=5)).status_code == 422
    assert client.post("/api/admin/events", json=body(slug="x")).status_code == 422


def test_el_fin_puede_ser_igual_al_inicio(client):
    assert client.post("/api/admin/events", json=body(ends_at=FUTURE.isoformat())).status_code == 201


def test_un_fallo_del_asistente_no_impide_guardar(client, db, sync):
    sync.fail = True
    r = client.post("/api/admin/events", json=body())
    assert r.status_code == 201 and r.json()["rag_sync"] == "failed"
    assert len(db.event_rows) == 1


# --- leer -------------------------------------------------------------------


def test_listar_filtrar_y_buscar(client):
    client.post("/api/admin/events", json=body(title="Charla de IA", place_id=7, organizer="Facultad de Sistemas"))
    client.post("/api/admin/events", json=body(title="Feria", is_published=False, keywords=["Ciencia"]))
    todos = client.get("/api/admin/events").json()
    assert len(todos) == 2 and "created_at" in todos[0] and "updated_by" in todos[0]
    assert [e["title"] for e in client.get("/api/admin/events?published=false").json()] == ["Feria"]
    assert [e["title"] for e in client.get("/api/admin/events?place=7").json()] == ["Charla de IA"]
    assert [e["title"] for e in client.get("/api/admin/events?q=sistemas").json()] == ["Charla de IA"]
    assert [e["title"] for e in client.get("/api/admin/events?q=CIENCIA").json()] == ["Feria"]


def test_obtener_uno_y_los_ids_invalidos(client):
    client.post("/api/admin/events", json=body())
    assert client.get("/api/admin/events/1").json()["title"] == "Feria de Ciencias"
    for bad in ("99", "0", "abc", "-1"):
        assert client.get(f"/api/admin/events/{bad}").status_code == 404


# --- editar y borrar --------------------------------------------------------


def test_editar_reemplaza_todo_y_no_cambia_el_slug(client, sync):
    creado = client.post("/api/admin/events", json=body(organizer="Facultad X", place_id=7)).json()
    r = client.put(f"/api/admin/events/{creado['id']}", json=body(title="Otro título", status="postponed", status_note="Nueva fecha"))
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Otro título" and data["status"] == "postponed" and data["slug"] == creado["slug"]
    assert data["organizer"] is None and data["place_id"] is None  # lo que no se envía queda vacío
    assert sync.calls == [creado["id"], creado["id"]]


def test_editar_lo_inexistente_es_404_y_valida_igual_que_crear(client):
    assert client.put("/api/admin/events/99", json=body()).status_code == 404
    client.post("/api/admin/events", json=body())
    r = client.put("/api/admin/events/1", json=body(place_id=999))
    assert r.status_code == 422 and "place_id" in errors(r)


def test_despublicar_se_hace_editando(client, sync):
    client.post("/api/admin/events", json=body())
    r = client.put("/api/admin/events/1", json=body(is_published=False))
    assert r.json()["is_published"] is False and sync.calls == [1, 1]


def test_borrar_quita_el_evento_y_su_documento(client, db, sync):
    creado = client.post("/api/admin/events", json=body()).json()
    r = client.delete(f"/api/admin/events/{creado['id']}")
    assert r.status_code == 200 and r.json() == {"rag_sync": "ok"}
    assert sync.removed == [creado["slug"]] and db.event_rows == {}
    assert client.delete(f"/api/admin/events/{creado['id']}").status_code == 404


def test_reindexar(client, sync):
    client.post("/api/admin/events", json=body())
    r = client.post("/api/admin/events/1/reindex")
    assert r.status_code == 200 and r.json()["rag_sync"] == "ok" and sync.calls == [1, 1]
    assert client.post("/api/admin/events/99/reindex").status_code == 404


# --- lugares ----------------------------------------------------------------


def test_un_lugar_con_eventos_no_se_puede_borrar(client):
    client.post("/api/admin/events", json=body(place_id=7))
    r = client.delete("/api/admin/places/7")
    assert r.status_code == 409
    assert r.json()["detail"] == "No se puede borrar: tiene 1 evento. Bórralos o cámbialos de lugar antes."
    client.delete("/api/admin/events/1")
    assert client.delete("/api/admin/places/7").status_code == 200


# --- públicos ---------------------------------------------------------------


def test_la_api_publica_solo_muestra_lo_proximo_y_visible(client):
    client.post("/api/admin/events", json=body(title="Visible", place_id=7))
    client.post("/api/admin/events", json=body(title="Oculto", is_published=False))
    client.post("/api/admin/events", json=body(title="Cancelado", status="cancelled"))
    client.post("/api/admin/events", json=body(
        title="Pasado", starts_at=(FUTURE - timedelta(days=30)).isoformat(), ends_at=(FUTURE - timedelta(days=29)).isoformat()))
    r = TestClient(client.app).get("/api/events")  # sin sesión
    assert r.status_code == 200
    assert [e["title"] for e in r.json()] == ["Visible"]
    assert "Cache-Control" in r.headers and "ETag" in r.headers
    publico = r.json()[0]
    assert publico["place_id"] == 7
    assert not {"is_published", "created_at", "updated_by", "keywords"} & publico.keys()  # nada interno
