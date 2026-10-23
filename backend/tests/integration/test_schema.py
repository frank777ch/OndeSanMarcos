"""RF-23.5: el esquema creado por las migraciones y el aislamiento de la base de pruebas."""

import psycopg
import pytest

from app.rag.db import Database

pytestmark = pytest.mark.integration


def test_tests_run_on_a_separate_test_database(test_database_url):
    """RF-23.26: nunca se usa la base de desarrollo."""
    with psycopg.connect(test_database_url) as conn:
        name = conn.execute("select current_database()").fetchone()[0]
    assert name.endswith("_test")


def test_migrations_create_vector_extension_table_index_and_function(test_database_url):
    with psycopg.connect(test_database_url) as conn:
        extensions = {r[0] for r in conn.execute("select extname from pg_extension")}
        columns = dict(
            conn.execute(
                "select column_name, udt_name from information_schema.columns "
                "where table_name = 'documents'"
            ).fetchall()
        )
        index = conn.execute(
            "select indexdef from pg_indexes where indexname = 'documents_embedding_idx'"
        ).fetchone()
        function = conn.execute(
            "select count(*) from pg_proc where proname = 'match_documents'"
        ).fetchone()[0]
        dims = conn.execute(
            "select atttypmod from pg_attribute "
            "where attrelid = 'documents'::regclass and attname = 'embedding'"
        ).fetchone()[0]

    assert "vector" in extensions
    assert set(columns) == {"id", "content", "metadata", "embedding"}
    assert columns["embedding"] == "vector"
    assert dims == 768
    assert index and "hnsw" in index[0] and "vector_cosine_ops" in index[0]
    assert function == 1


def test_migration_has_nothing_specific_to_supabase():
    """RF-23.5: sin roles ni grants de Supabase."""
    from tests.integration.conftest import MIGRATIONS_DIR

    text = (MIGRATIONS_DIR / "V1__pgvector_schema.sql").read_text(encoding="utf-8").lower()
    assert "service_role" not in text
    assert "grant " not in text
    assert "supabase" not in text


def test_database_wrapper_connects_and_counts(db: Database):
    assert db.count() == 0


def test_pool_recovers_after_the_database_drops_its_connections(db: Database, test_database_url):
    """Si la base se reinicia (o corta conexiones), la siguiente consulta funciona igual."""
    assert db.count() == 0  # abre una conexión del pool

    with psycopg.connect(test_database_url, autocommit=True) as admin:
        admin.execute(
            "select pg_terminate_backend(pid) from pg_stat_activity "
            "where datname = current_database() and pid <> pg_backend_pid()"
        )

    assert db.count() == 0  # no debe fallar con una conexión muerta
