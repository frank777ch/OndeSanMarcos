"""Fixtures de las pruebas de integración (Postgres real).

IMPORTANTE (RF-23.26): estas pruebas NUNCA tocan la base de desarrollo, que guarda
los vectores del asistente (regenerarlos gasta cuota de Gemini). Crean su propia
base `<nombre>_test`, le aplican las migraciones de `backend/db/migrations` y la
borran al terminar. Sin `DATABASE_URL` las pruebas se omiten.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import psycopg
import pytest
from psycopg import sql

from app.rag.db import Database

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "db" / "migrations"
DIM = 768


def vec(index: int) -> list[float]:
    """Vector de 768 dimensiones con un 1 en `index` (ortogonales entre sí)."""
    v = [0.0] * DIM
    v[index] = 1.0
    return v


def _with_database(url: str, name: str) -> str:
    parts = urlparse(url)
    return urlunparse(parts._replace(path=f"/{name}"))


@pytest.fixture(scope="session")
def test_database_url() -> Iterator[str]:
    base_url = os.environ.get("DATABASE_URL", "")
    if not base_url:
        pytest.skip("Sin DATABASE_URL: se omiten las pruebas de integración.")

    dev_name = urlparse(base_url).path.lstrip("/")
    test_name = f"{dev_name}_test"
    # Seguro contra errores: jamás se borra algo que no termine en `_test`.
    assert test_name.endswith("_test") and test_name != dev_name

    admin = psycopg.connect(base_url, autocommit=True, connect_timeout=5)
    try:
        admin.execute(sql.SQL("drop database if exists {} with (force)").format(sql.Identifier(test_name)))
        admin.execute(sql.SQL("create database {}").format(sql.Identifier(test_name)))

        test_url = _with_database(base_url, test_name)
        with psycopg.connect(test_url, autocommit=True) as conn:
            for migration in sorted(MIGRATIONS_DIR.glob("V*.sql")):
                conn.execute(migration.read_text(encoding="utf-8"))
        yield test_url
    finally:
        admin.execute(sql.SQL("drop database if exists {} with (force)").format(sql.Identifier(test_name)))
        admin.close()


@pytest.fixture
def db(test_database_url: str) -> Iterator[Database]:
    """`Database` sobre la base de pruebas, con la tabla vacía."""
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate documents restart identity")
    database = Database(test_database_url)
    try:
        yield database
    finally:
        database.close()


def row(content: str, place_id: str, embedding: list[float]) -> dict:
    return {
        "content": content,
        "metadata": {"document_id": f"doc-{place_id}", "place_id": place_id, "title": place_id, "position": 0},
        "embedding": embedding,
    }
