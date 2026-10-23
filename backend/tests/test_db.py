"""Tests de `app.rag.db` sin Postgres real (fakes y una conexión rechazada)."""

from __future__ import annotations

import time
from contextlib import contextmanager

import pytest

from app.config import Settings
from app.rag.db import EMPTY_MESSAGE, Database, get_database, vector_literal
from app.rag.errors import RagProviderError


def test_vector_literal_format():
    assert vector_literal([0.5, 1, -2.25]) == "[0.5,1.0,-2.25]"


def test_get_database_requires_database_url():
    with pytest.raises(RagProviderError, match="DATABASE_URL"):
        get_database(Settings(_env_file=None, database_url=""))


def test_get_database_shares_one_pool_per_configuration():
    settings = Settings(_env_file=None, database_url="postgresql://u:p@localhost:1/x")
    assert get_database(settings) is get_database(settings)


def test_database_does_not_connect_until_first_use():
    """RF-23.13: crear la base no abre conexiones (el servidor arranca sin ella)."""
    db = Database("postgresql://u:p@127.0.0.1:1/x")
    assert db._opened is False
    db.close()  # no falla aunque nunca se abrió


def test_unreachable_database_raises_clear_error_quickly():
    """RF-23.14: base caída -> RagProviderError en pocos segundos, sin colgarse."""
    db = Database("postgresql://u:p@127.0.0.1:1/x", timeout=2.0)
    started = time.monotonic()
    try:
        with pytest.raises(RagProviderError, match="base de datos"):
            db.count()
    finally:
        db.close()
    assert time.monotonic() - started < 8


# --- match() con una conexión falsa --------------------------------------------


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def fetchall(self):
        return self._rows

    def fetchone(self):
        return self._rows[0] if self._rows else None


class _Conn:
    def __init__(self, match_rows, table_empty):
        self.match_rows = match_rows
        self.table_empty = table_empty
        self.queries: list[str] = []

    def execute(self, query, params=None):
        text = query.as_string() if hasattr(query, "as_string") else str(query)
        self.queries.append(text)
        if "match_documents" in text:
            return _Result(self.match_rows)
        return _Result([{"empty": self.table_empty}])


def _db_with(conn):
    db = Database("postgresql://u:p@127.0.0.1:1/x")

    @contextmanager
    def fake_connection():
        yield conn

    db.connection = fake_connection  # type: ignore[method-assign]
    return db


def test_match_returns_rows_as_they_come():
    rows = [{"id": 1, "content": "a", "metadata": {}, "similarity": 0.9}]
    conn = _Conn(rows, table_empty=False)
    assert _db_with(conn).match([0.1, 0.2], 4) == rows


def test_match_with_no_rows_on_empty_table_asks_to_ingest():
    """RF-23.15: base conectada pero vacía -> mensaje que indica ingerir."""
    db = _db_with(_Conn([], table_empty=True))
    with pytest.raises(RagProviderError) as info:
        db.match([0.1, 0.2], 4)
    assert str(info.value) == EMPTY_MESSAGE
    assert "./script/dev.sh ingest" in EMPTY_MESSAGE


def test_match_with_no_rows_on_filled_table_returns_empty_list():
    """Sin coincidencias pero con datos: no es un error."""
    assert _db_with(_Conn([], table_empty=False)).match([0.1, 0.2], 4) == []


def test_match_uses_the_configured_function_with_a_vector_cast():
    conn = _Conn([{"id": 1}], table_empty=False)
    _db_with(conn).match([0.1], 3)
    assert "match_documents" in conn.queries[0]
    assert "::vector" in conn.queries[0]
