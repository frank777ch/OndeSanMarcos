"""HU-29: origen de cada fragmento (`source_type`, `source_id`) y ficha por lugar."""

import psycopg
import pytest

from tests.integration.conftest import vec

pytestmark = pytest.mark.integration


def fragment(content: str, source_type: str, source_id: str, position: int, index: int) -> dict:
    return {
        "content": content,
        "metadata": {"document_id": source_id, "place_id": None, "title": source_id, "position": position},
        "embedding": vec(index),
        "source_type": source_type,
        "source_id": source_id,
    }


def sources(test_database_url: str) -> set[tuple[str, str, str]]:
    with psycopg.connect(test_database_url) as conn:
        rows = conn.execute("select source_type, source_id, content from documents").fetchall()
    return {tuple(r) for r in rows}


def test_rf_29_16_el_indice_unico_impide_duplicar_un_origen(db, test_database_url):
    db.insert_rows([fragment("uno", "place", "fisi", 0, 0)])
    with pytest.raises(psycopg.errors.UniqueViolation):
        db.insert_rows([fragment("repetido", "place", "fisi", 0, 1)])


def test_rf_29_16_un_origen_admite_varias_posiciones_y_otro_origen_la_misma(db):
    db.insert_rows(
        [
            fragment("a0", "place", "fisi", 0, 0),
            fragment("a1", "place", "fisi", 1, 1),
            fragment("b0", "place", "fic", 0, 2),
            fragment("c0", "corpus", "fisi", 0, 3),
        ]
    )
    assert db.count() == 4


def test_rf_29_5_replace_source_reemplaza_solo_esa_ficha(db, test_database_url):
    db.insert_rows(
        [
            fragment("fisi viejo", "place", "fisi", 0, 0),
            fragment("fic", "place", "fic", 0, 1),
            fragment("general", "corpus", "doc-campus", 0, 2),
        ]
    )

    db.replace_source("place", "fisi", [fragment("fisi nuevo", "place", "fisi", 0, 3)])

    assert sources(test_database_url) == {
        ("place", "fisi", "fisi nuevo"),
        ("place", "fic", "fic"),
        ("corpus", "doc-campus", "general"),
    }


def test_rf_29_6_delete_source_borra_la_ficha_y_nada_mas(db, test_database_url):
    db.insert_rows(
        [
            fragment("fisi", "place", "fisi", 0, 0),
            fragment("fisi corpus", "corpus", "fisi", 0, 1),
        ]
    )

    assert db.delete_source("place", "fisi") == 1
    assert db.delete_source("place", "fisi") == 0
    assert sources(test_database_url) == {("corpus", "fisi", "fisi corpus")}


def test_rf_29_5_replace_source_es_atomico(db, test_database_url):
    db.insert_rows([fragment("viejo", "place", "fisi", 0, 0)])
    malos = [fragment("a", "place", "fisi", 0, 1), fragment("b", "place", "fisi", 0, 2)]  # misma posición

    with pytest.raises(psycopg.errors.UniqueViolation):
        db.replace_source("place", "fisi", malos)

    assert sources(test_database_url) == {("place", "fisi", "viejo")}


def test_rf_29_5_place_for_sync_incluye_categoria_contenedor_y_despublicados(db, test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate places, place_categories restart identity cascade")
        cat = conn.execute(
            "insert into place_categories (slug, label, color, icon, sort_order) "
            "values ('facultades', 'Facultades', '#3056ac', 'graduation-cap', 0) returning id"
        ).fetchone()[0]
        padre = conn.execute(
            "insert into places (slug, name, category_id, lat, lng) values ('campus', 'Campus', %s, -12.05, -77.08) returning id",
            (cat,),
        ).fetchone()[0]
        hijo = conn.execute(
            "insert into places (slug, name, category_id, lat, lng, parent_place_id, is_published) "
            "values ('fisi', 'FISI', %s, -12.05, -77.08, %s, false) returning id",
            (cat, padre),
        ).fetchone()[0]

    fila = db.place_for_sync(hijo)
    assert fila["slug"] == "fisi"
    assert fila["category_label"] == "Facultades"
    assert fila["parent_name"] == "Campus"
    assert fila["is_published"] is False
    assert [p["slug"] for p in db.places_for_sync()] == ["campus", "fisi"]
    assert db.place_for_sync(99999) is None
