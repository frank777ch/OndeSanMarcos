"""HU-24: tabla `admin_users` y siembra del administrador contra Postgres real."""

import psycopg
import pytest

from app.auth.admin import ensure_initial_admin
from app.auth.passwords import verify_password
from app.rag.db import Database

pytestmark = pytest.mark.integration


@pytest.fixture
def admin_db(test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate admin_users restart identity")
    database = Database(test_database_url)
    try:
        yield database
    finally:
        database.close()


def _rows(url):
    with psycopg.connect(url) as conn:
        return conn.execute("select username, password_hash from admin_users").fetchall()


def test_rf_24_1_migration_creates_admin_users(test_database_url):
    with psycopg.connect(test_database_url) as conn:
        cols = dict(
            conn.execute(
                "select column_name, is_nullable from information_schema.columns "
                "where table_name = 'admin_users'"
            ).fetchall()
        )
        unique = conn.execute(
            "select count(*) from pg_indexes where tablename = 'admin_users' "
            "and indexdef ilike '%unique%(username)%'"
        ).fetchone()[0]
    assert set(cols) == {"id", "username", "password_hash", "created_at"}
    assert cols["username"] == "NO" and cols["password_hash"] == "NO"
    assert unique == 1


def test_rf_24_3_creates_admin_with_hashed_password(admin_db, test_database_url):
    assert ensure_initial_admin(admin_db, "admin", "secreto") is True
    [(username, stored)] = _rows(test_database_url)
    assert username == "admin" and stored.startswith("$2b$")
    assert verify_password("secreto", stored)


def test_rf_24_5_restart_keeps_one_row_and_same_hash(admin_db, test_database_url):
    ensure_initial_admin(admin_db, "admin", "secreto")
    before = _rows(test_database_url)
    assert ensure_initial_admin(admin_db, "admin", "otra") is False
    assert _rows(test_database_url) == before


def test_rf_24_5_insert_conflict_is_silent(admin_db):
    assert admin_db.insert_admin("a", "h1") is True
    assert admin_db.insert_admin("a", "h2") is False
