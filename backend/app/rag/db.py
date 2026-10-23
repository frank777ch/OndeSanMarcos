"""Acceso a Postgres (pgvector) con SQL directo (`psycopg` 3).

Concentra todo lo que el RAG hace con la base: buscar por similitud
(`match_documents`), reemplazar el corpus y subir/borrar fragmentos por lugar.

- El pool de conexiones se abre de forma **perezosa**: el servidor arranca aunque
  la base esté apagada y en modo mock nunca se abre una conexión.
- Cualquier fallo de conexión se convierte en `RagProviderError`, que `main.py`
  devuelve como 503 con un mensaje claro.
- Los vectores viajan como texto (`'[0.1,0.2]'::vector`): no hace falta el
  paquete `pgvector` ni numpy.
"""

from __future__ import annotations

import threading
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from functools import lru_cache
from typing import Any

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool, PoolTimeout

from app.config import Settings
from app.rag.errors import RagProviderError

EMPTY_MESSAGE = "La base de conocimiento está vacía; ejecuta ./script/dev.sh ingest"
_BATCH = 100


def vector_literal(values: Sequence[float]) -> str:
    """Formato de texto que Postgres entiende como `vector`: `[0.1,0.2,...]`."""
    return "[" + ",".join(repr(float(v)) for v in values) + "]"


class Database:
    """Operaciones del RAG sobre la tabla de fragmentos."""

    def __init__(
        self,
        url: str,
        *,
        table: str = "documents",
        match_fn: str = "match_documents",
        timeout: float = 3.0,
    ) -> None:
        self._table = sql.Identifier(table)
        self._match_fn = sql.Identifier(match_fn)
        self._pool = ConnectionPool(
            url,
            min_size=1,
            max_size=5,
            open=False,
            timeout=timeout,
            # Valida la conexión antes de entregarla: si la base se reinició, la
            # conexión vieja se descarta y se abre otra en vez de fallar la consulta.
            check=ConnectionPool.check_connection,
            kwargs={"connect_timeout": max(1, int(timeout)), "row_factory": dict_row},
        )
        self._lock = threading.Lock()
        self._opened = False

    # --- conexión -----------------------------------------------------------

    def _ensure_open(self) -> None:
        with self._lock:
            if not self._opened:
                self._pool.open(wait=False)
                self._opened = True

    @contextmanager
    def connection(self) -> Iterator[psycopg.Connection[Any]]:
        """Conexión del pool; los fallos de red salen como `RagProviderError`."""
        self._ensure_open()
        try:
            with self._pool.connection() as conn:
                yield conn
        except (psycopg.OperationalError, PoolTimeout) as exc:
            raise RagProviderError(
                "No se pudo conectar a la base de datos. ¿Está levantada? "
                "Ejecuta ./script/dev.sh y revisa DATABASE_URL."
            ) from exc

    def close(self) -> None:
        if self._opened:
            self._pool.close()
            self._opened = False

    # --- lectura ------------------------------------------------------------

    def count(self) -> int:
        with self.connection() as conn:
            row = conn.execute(
                sql.SQL("select count(*) as n from {t}").format(t=self._table)
            ).fetchone()
        return int(row["n"]) if row else 0

    def place_ids(self) -> set[str]:
        """`place_id` distintos presentes en el corpus."""
        with self.connection() as conn:
            rows = conn.execute(
                sql.SQL(
                    "select distinct metadata->>'place_id' as place_id from {t} "
                    "where metadata->>'place_id' is not null"
                ).format(t=self._table)
            ).fetchall()
        return {row["place_id"] for row in rows}

    def match(self, query_vector: Sequence[float], match_count: int) -> list[dict]:
        """Top `match_count` fragmentos por similitud coseno (`match_documents`).

        Si no hay resultados y la tabla está vacía, lanza `RagProviderError` con
        el mensaje de «base vacía» (RF-23.15).
        """
        query = sql.SQL(
            "select id, content, metadata, similarity from {fn}(%s::vector, %s)"
        ).format(fn=self._match_fn)
        with self.connection() as conn:
            rows = conn.execute(query, (vector_literal(query_vector), match_count)).fetchall()
            if not rows:
                empty = conn.execute(
                    sql.SQL("select not exists (select 1 from {t}) as empty").format(
                        t=self._table
                    )
                ).fetchone()
                if empty and empty["empty"]:
                    raise RagProviderError(EMPTY_MESSAGE)
        return list(rows)

    # --- escritura ----------------------------------------------------------

    def _insert(self, conn: psycopg.Connection[Any], rows: list[dict]) -> None:
        query = sql.SQL(
            "insert into {t} (content, metadata, embedding) values (%s, %s, %s::vector)"
        ).format(t=self._table)
        for start in range(0, len(rows), _BATCH):
            batch = rows[start : start + _BATCH]
            with conn.cursor() as cur:
                cur.executemany(
                    query,
                    [
                        (r["content"], Jsonb(r["metadata"]), vector_literal(r["embedding"]))
                        for r in batch
                    ],
                )

    def replace_all(self, rows: list[dict]) -> None:
        """Reemplaza todo el contenido en UNA transacción (atómico e idempotente)."""
        with self.connection() as conn:
            with conn.transaction():
                conn.execute(sql.SQL("delete from {t}").format(t=self._table))
                self._insert(conn, rows)

    def count_place(self, place_id: str) -> int:
        with self.connection() as conn:
            row = conn.execute(
                sql.SQL("select count(*) as n from {t} where metadata->>'place_id' = %s").format(
                    t=self._table
                ),
                (place_id,),
            ).fetchone()
        return int(row["n"]) if row else 0

    def replace_place(self, place_id: str, rows: list[dict]) -> None:
        """Borra los fragmentos del lugar e inserta los nuevos, en una transacción."""
        with self.connection() as conn:
            with conn.transaction():
                conn.execute(
                    sql.SQL("delete from {t} where metadata->>'place_id' = %s").format(
                        t=self._table
                    ),
                    (place_id,),
                )
                self._insert(conn, rows)

    def insert_rows(self, rows: list[dict]) -> None:
        with self.connection() as conn:
            with conn.transaction():
                self._insert(conn, rows)


@lru_cache
def _database_for(url: str, table: str, match_fn: str, timeout: float) -> Database:
    return Database(url, table=table, match_fn=match_fn, timeout=timeout)


def get_database(settings: Settings) -> Database:
    """Base compartida para la configuración dada (un solo pool por proceso)."""
    if not settings.database_url:
        raise RagProviderError("Falta DATABASE_URL para usar la base de datos del RAG.")
    return _database_for(
        settings.database_url,
        settings.pgvector_table,
        settings.pgvector_match_fn,
        float(settings.db_connect_timeout),
    )
