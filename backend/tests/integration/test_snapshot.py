"""HU-29 · RF-29.17: el snapshot versionado solo llena `documents` si está vacía."""

from pathlib import Path

import psycopg
import pytest

from tests.integration.conftest import vec

pytestmark = pytest.mark.integration

SNAPSHOT = Path(__file__).resolve().parents[2] / "db" / "migrations" / "R__documents_snapshot.sql"


def aplicar(url: str) -> None:
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(SNAPSHOT.read_text(encoding="utf-8"))


def contar(url: str) -> int:
    with psycopg.connect(url) as conn:
        return conn.execute("select count(*) from documents").fetchone()[0]


def test_rf_29_17_en_una_base_vacia_el_snapshot_llena_la_tabla(db, test_database_url):
    aplicar(test_database_url)
    with psycopg.connect(test_database_url) as conn:
        total, con_origen, sin_vector = conn.execute(
            "select count(*), count(source_type), count(*) filter (where embedding is null) from documents"
        ).fetchone()
    assert total > 0 and con_origen == total and sin_vector == 0


def test_rf_29_17_con_datos_el_snapshot_no_borra_ni_agrega_nada(db, test_database_url):
    db.insert_rows(
        [
            {
                "content": "ficha creada desde el panel",
                "metadata": {"document_id": "place-nuevo", "place_id": "nuevo", "title": "Nuevo", "position": 0},
                "embedding": vec(0),
                "source_type": "place",
                "source_id": "nuevo",
            }
        ]
    )

    aplicar(test_database_url)
    aplicar(test_database_url)  # también es idempotente

    assert contar(test_database_url) == 1
    with psycopg.connect(test_database_url) as conn:
        assert conn.execute("select content from documents").fetchone()[0] == "ficha creada desde el panel"
