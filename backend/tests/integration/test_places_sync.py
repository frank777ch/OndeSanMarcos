"""HU-29: `RagPlaceSync` contra Postgres real, con un embedding falso (no llama a Gemini)."""

import psycopg
import pytest

from app.config import get_settings
from app.places.directory import PlaceDirectory
from app.places.sync import RagPlaceSync, safe_sync

pytestmark = pytest.mark.integration


class FakeEmbedding:
    def __init__(self, fail=False):
        self.fail = fail

    def embed_document(self, text):
        if self.fail:
            raise RuntimeError("Gemini caído")
        vector = [0.0] * 768
        vector[0] = 1.0
        return vector


@pytest.fixture
def lugar(db, test_database_url):
    """Un lugar publicado en la base de pruebas; devuelve su id."""
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate places, place_categories restart identity cascade")
        categoria = conn.execute(
            "insert into place_categories (slug, label, color, icon, sort_order) "
            "values ('servicios', 'Servicios', '#3056ac', 'wrench', 0) returning id"
        ).fetchone()[0]
        return conn.execute(
            "insert into places (slug, name, category_id, lat, lng, description, schedule) "
            "values ('laboratorio-zeta', 'Laboratorio Zeta', %s, -12.05, -77.08, 'Laboratorio de pruebas.', 'Lun–Vie 9:00–17:00') "
            "returning id",
            (categoria,),
        ).fetchone()[0]


def fichas(url):
    with psycopg.connect(url) as conn:
        return conn.execute(
            "select source_type, source_id, content from documents where source_type = 'place' order by id"
        ).fetchall()


def sincronizador(db, embedding):
    return RagPlaceSync(db, lambda: embedding, get_settings(), PlaceDirectory(db.list_places))


def test_rf_29_5_crear_y_editar_reemplazan_la_ficha(db, test_database_url, lugar):
    sync = sincronizador(db, FakeEmbedding())

    assert sync.sync(lugar) == "ok"
    primera = fichas(test_database_url)
    assert [(t, s) for t, s, _ in primera] == [("place", "laboratorio-zeta")]
    assert "Laboratorio Zeta." in primera[0][2] and "Categoría: Servicios." in primera[0][2]

    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("update places set schedule = 'Lun–Sáb 8:00–20:00' where id = %s", (lugar,))
    assert sync.sync(lugar) == "ok"

    despues = fichas(test_database_url)
    assert len(despues) == 1  # se reemplazó, no se duplicó
    assert "Lun–Sáb 8:00–20:00" in despues[0][2]


def test_rf_29_6_despublicar_borra_la_ficha_y_el_corpus_queda(db, test_database_url, lugar):
    db.insert_rows(
        [
            {
                "content": "general",
                "metadata": {"document_id": "doc-campus", "place_id": None, "title": "Campus", "position": 0},
                "embedding": FakeEmbedding().embed_document("x"),
                "source_type": "corpus",
                "source_id": "doc-campus",
            }
        ]
    )
    sync = sincronizador(db, FakeEmbedding())
    sync.sync(lugar)
    assert len(fichas(test_database_url)) == 1

    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("update places set is_published = false where id = %s", (lugar,))
    assert sync.sync(lugar) == "ok"

    assert fichas(test_database_url) == []
    assert db.count() == 1  # el documento general sigue


def test_rf_29_7_si_falla_el_embedding_la_ficha_anterior_sigue(db, test_database_url, lugar):
    sincronizador(db, FakeEmbedding()).sync(lugar)
    antes = fichas(test_database_url)

    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("update places set description = 'Descripción nueva' where id = %s", (lugar,))
    assert safe_sync(sincronizador(db, FakeEmbedding(fail=True)), lugar) == "failed"

    assert fichas(test_database_url) == antes


def test_rf_29_15_el_directorio_refleja_el_lugar_tras_sincronizar(db, test_database_url, lugar):
    directorio = PlaceDirectory(db.list_places)
    assert [p.id for p in directorio.find("horario del laboratorio zeta")] == ["laboratorio-zeta"]

    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("update places set is_published = false where id = %s", (lugar,))
    assert directorio.published_slugs() == {"laboratorio-zeta"}  # aún en memoria

    RagPlaceSync(db, lambda: FakeEmbedding(), get_settings(), directorio).sync(lugar)
    assert directorio.published_slugs() == set()
