"""Eventos contra Postgres real: tabla (V12), caducidad en la búsqueda (V13), CRUD y sincronización."""

from datetime import datetime, timedelta, timezone

import psycopg
import pytest

from app.config import get_settings
from app.events.sync import RagEventSync, safe_sync
from app.events.timeutil import LIMA, expires_at
from app.rag.db import _EVENT_ENDS_SQL, EDITABLE_EVENT_COLUMNS
from tests.integration.conftest import vec

pytestmark = pytest.mark.integration

NOW = datetime.now(timezone.utc)
FUTURE = NOW + timedelta(days=2)
PAST = NOW - timedelta(days=2)


class FakeEmbedding:
    def __init__(self, fail=False):
        self.fail = fail

    def embed_document(self, text):
        if self.fail:
            raise RuntimeError("Gemini caído")
        return vec(0)


@pytest.fixture
def lugar(db, test_database_url):
    """Un lugar publicado (con un contenedor) en la base de pruebas; devuelve su id."""
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate events, places, place_categories restart identity cascade")
        categoria = conn.execute(
            "insert into place_categories (slug, label, color, icon, sort_order) "
            "values ('servicios', 'Servicios', '#3056ac', 'wrench', 0) returning id"
        ).fetchone()[0]
        padre = conn.execute(
            "insert into places (slug, name, category_id, lat, lng) values ('biblioteca', 'Biblioteca Central', %s, -12.05, -77.08) returning id",
            (categoria,),
        ).fetchone()[0]
        return conn.execute(
            "insert into places (slug, name, category_id, lat, lng, parent_place_id) "
            "values ('auditorio-zeta', 'Auditorio Zeta', %s, -12.05, -77.08, %s) returning id",
            (categoria, padre),
        ).fetchone()[0]


def datos(**extra):
    base = {c: None for c in EDITABLE_EVENT_COLUMNS}
    base.update(
        title="Feria de Ciencias", starts_at=FUTURE, ends_at=FUTURE + timedelta(hours=3), category="feria",
        status="scheduled", modality="in_person", agenda=[], keywords=[], is_published=True,
    )
    base.update(extra)
    return base


def docs(url):
    with psycopg.connect(url) as conn:
        return conn.execute(
            "select source_type, source_id, content, metadata from documents where source_type = 'event' order by id"
        ).fetchall()


def sincronizador(db, embedding=None):
    return RagEventSync(db, lambda: embedding or FakeEmbedding(), get_settings())


# --- tabla ----------------------------------------------------------------


def test_la_tabla_rechaza_datos_incoherentes(db, test_database_url, lugar):
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        for sentencia in (
            "insert into events (slug, title, starts_at, ends_at) values ('a', 'A', now(), now() - interval '1 hour')",
            "insert into events (slug, title, starts_at, status) values ('b', 'B', now(), 'otro')",
            "insert into events (slug, title, starts_at, category) values ('c', 'C', now(), 'zzz')",
            "insert into events (slug, title, starts_at, modality) values ('d', 'D', now(), 'zzz')",
            "insert into events (slug, title, starts_at) values ('Slug Malo', 'E', now())",
            "insert into events (slug, title, starts_at) values ('f', '', now())",
            "insert into events (slug, title, starts_at, place_id) values ('g', 'G', now(), 999999)",
        ):
            with pytest.raises(psycopg.errors.CheckViolation if "999999" not in sentencia else psycopg.errors.ForeignKeyViolation):
                conn.execute(sentencia)


# --- CRUD -----------------------------------------------------------------


def test_crear_editar_y_borrar(db, lugar):
    creado = db.create_event(datos(place_id=lugar), "admin")
    assert creado["slug"].startswith("feria-de-ciencias-") and creado["updated_by"] == "admin"
    otro = db.create_event(datos(place_id=lugar), "admin")
    assert otro["slug"] == creado["slug"] + "-2"  # mismo título y día: se distingue sin chocar

    editado = db.update_event(creado["id"], datos(title="Feria de Biología", place_id=None), "otro")
    assert editado["title"] == "Feria de Biología" and editado["place_id"] is None
    assert editado["slug"] == creado["slug"]  # el slug no cambia al renombrar
    assert db.update_event(999999, datos(), "x") is None

    assert db.delete_event(creado["id"]) == ("deleted", creado["slug"])
    assert db.delete_event(creado["id"]) == ("not_found", 0)
    assert [e["id"] for e in db.admin_list_events()] == [otro["id"]]


def test_un_lugar_con_eventos_no_se_borra(db, lugar):
    evento = db.create_event(datos(place_id=lugar), "admin")
    assert db.delete_place(lugar) == ("has_events", 1)
    db.delete_event(evento["id"])
    assert db.delete_place(lugar)[0] == "deleted"


# --- próximos -------------------------------------------------------------


def test_upcoming_solo_trae_publicados_no_cancelados_y_no_terminados(db, lugar):
    futuro = db.create_event(datos(title="Futuro"), "a")
    db.create_event(datos(title="Pasado", starts_at=PAST, ends_at=PAST + timedelta(hours=2)), "a")
    db.create_event(datos(title="Oculto", is_published=False), "a")
    db.create_event(datos(title="Cancelado", status="cancelled"), "a")
    sin_fin_pasado = db.create_event(datos(title="Sin fin pasado", starts_at=PAST, ends_at=None), "a")
    sin_fin_futuro = db.create_event(datos(title="Sin fin futuro", starts_at=FUTURE + timedelta(days=1), ends_at=None), "a")
    reprogramado = db.create_event(datos(title="Reprogramado", status="postponed"), "a")

    titulos = [e["title"] for e in db.upcoming_events()]
    assert titulos == ["Futuro", "Reprogramado", "Sin fin futuro"]
    assert "Sin fin pasado" not in titulos
    assert {futuro["id"], reprogramado["id"], sin_fin_futuro["id"]} == {e["id"] for e in db.upcoming_events()}
    assert sin_fin_pasado["id"] not in {e["id"] for e in db.upcoming_events()}
    publico = db.upcoming_events()[0]
    assert "is_published" not in publico and "updated_by" not in publico and "keywords" not in publico


@pytest.mark.parametrize(
    "inicio",
    [
        datetime(2026, 11, 22, 10, 0, tzinfo=LIMA),
        datetime(2026, 11, 22, 23, 59, tzinfo=LIMA),   # justo antes de medianoche en Lima
        datetime(2026, 11, 23, 0, 0, tzinfo=LIMA),     # justo después
        datetime(2026, 11, 23, 4, 30, tzinfo=timezone.utc),  # 23:30 del 22 en Lima, ya es 23 en UTC
    ],
)
def test_el_fin_por_defecto_coincide_en_sql_y_en_python(db, test_database_url, lugar, inicio):
    """Sin `ends_at`, el SQL de «próximos» y el `expires_at` del asistente deben cortar en el mismo instante."""
    evento = db.create_event(datos(starts_at=inicio, ends_at=None), "a")
    with psycopg.connect(test_database_url) as conn:
        en_sql = conn.execute(f"select {_EVENT_ENDS_SQL} from events where id = %s", (evento["id"],)).fetchone()[0]
    assert en_sql == expires_at(inicio, None)


# --- asistente ------------------------------------------------------------


def test_la_busqueda_ignora_fragmentos_caducados(db):
    def fila(texto, vector, **meta):
        return {"content": texto, "metadata": {"document_id": texto, "place_id": None, "title": texto, "position": 0, **meta}, "embedding": vector}

    db.insert_rows([
        fila("vigente", vec(0), expires_at=(NOW + timedelta(hours=1)).isoformat()),
        fila("caducado", vec(0), expires_at=(NOW - timedelta(hours=1)).isoformat()),
        fila("sin-fecha", vec(0)),
    ])
    assert {r["content"] for r in db.match(vec(0), 10)} == {"vigente", "sin-fecha"}


def test_sync_crea_y_reemplaza_el_documento_del_evento(db, test_database_url, lugar):
    evento = db.create_event(datos(place_id=lugar, description="Muestras de ciencia."), "a")
    sync = sincronizador(db)

    assert sync.sync(evento["id"]) == "ok"
    (tipo, origen, contenido, meta), = docs(test_database_url)
    assert (tipo, origen) == ("event", evento["slug"])
    assert "Evento: Feria de Ciencias." in contenido and "Auditorio Zeta (dentro de Biblioteca Central)" in contenido
    assert meta["place_id"] == "auditorio-zeta"  # el chat puede señalar el lugar en el mapa
    assert datetime.fromisoformat(meta["expires_at"]) == FUTURE + timedelta(hours=3)  # caduca al terminar

    db.update_event(evento["id"], datos(place_id=lugar, title="Feria de Biología"), "a")
    assert sync.sync(evento["id"]) == "ok"
    despues = docs(test_database_url)
    assert len(despues) == 1 and "Feria de Biología" in despues[0][2]


def test_un_evento_cancelado_sigue_en_el_asistente_diciendo_que_se_cancelo(db, test_database_url, lugar):
    evento = db.create_event(datos(status="cancelled", status_note="Por lluvia."), "a")
    assert sincronizador(db).sync(evento["id"]) == "ok"
    assert "Estado: CANCELADO. Por lluvia." in docs(test_database_url)[0][2]


def test_despublicar_o_terminar_quita_el_documento(db, test_database_url, lugar):
    evento = db.create_event(datos(), "a")
    sync = sincronizador(db)
    sync.sync(evento["id"])
    assert len(docs(test_database_url)) == 1

    db.update_event(evento["id"], datos(is_published=False), "a")
    assert sync.sync(evento["id"]) == "ok" and docs(test_database_url) == []

    db.update_event(evento["id"], datos(starts_at=PAST, ends_at=PAST + timedelta(hours=1)), "a")
    sync.sync(evento["id"])
    assert docs(test_database_url) == []


def test_borrar_quita_el_documento_y_un_fallo_deja_el_anterior(db, test_database_url, lugar):
    evento = db.create_event(datos(), "a")
    assert sincronizador(db).sync(evento["id"]) == "ok"

    db.update_event(evento["id"], datos(title="Otro título"), "a")
    assert safe_sync(sincronizador(db, FakeEmbedding(fail=True)), evento["id"]) == "failed"
    assert "Evento: Feria de Ciencias." in docs(test_database_url)[0][2]  # el anterior sigue intacto

    assert sincronizador(db).remove(evento["slug"]) == "ok"
    assert docs(test_database_url) == []


def test_los_eventos_no_cuentan_como_ficha_del_lugar(db, test_database_url, lugar):
    evento = db.create_event(datos(place_id=lugar), "a")
    sincronizador(db).sync(evento["id"])
    assert db.place_ids() == set()  # `find_gaps` no debe creer que el lugar ya tiene su ficha
