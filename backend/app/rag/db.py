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

# Columnas de `places` que trae la semilla (el resto tiene valor por defecto).
# Columnas públicas de `places` (sin `created_at` ni `updated_by`): lista explícita
# para que un campo interno nuevo no se filtre por error a la API.
PUBLIC_PLACE_COLUMNS = (
    "id", "name", "short_name", "category_id", "lat", "lng", "keywords",
    "description", "schedule", "detailed_schedule", "phone", "annex", "email",
    "website", "access_hint", "careers", "services", "usage", "image_url",
    "parent_place_id", "is_published", "verified_at", "updated_at",
)

PLACE_SEED_COLUMNS = (
    "id", "name", "short_name", "category_id", "lat", "lng", "keywords",
    "description", "schedule", "detailed_schedule", "phone", "annex", "email",
    "website", "access_hint", "careers", "services", "usage", "image_url",
    "parent_place_id",
)


ADMIN_PLACE_COLUMNS = PUBLIC_PLACE_COLUMNS + ("created_at", "updated_by")

# Campos que el administrador puede escribir (HU-30).
EDITABLE_PLACE_COLUMNS = (
    "name", "short_name", "category_id", "lat", "lng", "keywords", "description",
    "schedule", "detailed_schedule", "phone", "annex", "email", "website",
    "access_hint", "careers", "services", "usage", "image_url", "parent_place_id",
    "is_published",
)


class DuplicateError(Exception):
    """Ya existe una fila con ese id."""


def _admin_columns() -> sql.Composed:
    return sql.SQL(", ").join(sql.Identifier(c) for c in ADMIN_PLACE_COLUMNS)


def _public_columns() -> sql.Composed:
    return sql.SQL(", ").join(sql.Identifier(c) for c in PUBLIC_PLACE_COLUMNS)


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

    # --- administradores ----------------------------------------------------

    def admin_exists(self, username: str) -> bool:
        with self.connection() as conn:
            row = conn.execute(
                "select 1 as found from admin_users where username = %s", (username,)
            ).fetchone()
        return row is not None

    def get_admin(self, username: str) -> dict | None:
        """Fila del administrador (`username`, `password_hash`) o `None`."""
        with self.connection() as conn:
            return conn.execute(
                "select username, password_hash from admin_users where username = %s",
                (username,),
            ).fetchone()

    def insert_admin(self, username: str, password_hash: str) -> bool:
        """Inserta el administrador; `False` si ya existía (sin error ni cambios)."""
        with self.connection() as conn:
            row = conn.execute(
                "insert into admin_users (username, password_hash) values (%s, %s) "
                "on conflict (username) do nothing returning id",
                (username, password_hash),
            ).fetchone()
        return row is not None

    # --- lugares ------------------------------------------------------------

    def list_place_categories(self) -> list[dict]:
        """Categorías ordenadas por `sort_order` (una consulta)."""
        with self.connection() as conn:
            return list(
                conn.execute(
                    "select id, label, color from place_categories order by sort_order, id"
                ).fetchall()
            )

    def list_places(self, category_id: str | None = None) -> list[dict]:
        """Lugares publicados, por nombre; opcionalmente de una categoría (una consulta)."""
        query = sql.SQL(
            "select {cols} from places where is_published "
            "and (%(category)s::text is null or category_id = %(category)s) "
            "order by name, id"
        ).format(cols=_public_columns())
        with self.connection() as conn:
            return list(conn.execute(query, {"category": category_id}).fetchall())

    def get_place(self, place_id: str) -> dict | None:
        """Un lugar publicado, o `None` si no existe o está oculto (una consulta)."""
        query = sql.SQL("select {cols} from places where id = %s and is_published").format(
            cols=_public_columns()
        )
        with self.connection() as conn:
            return conn.execute(query, (place_id,)).fetchone()

    def search_places(self, query: str, limit: int = 8) -> list[dict]:
        """Busca lugares publicados por nombre, sigla o palabra clave (HU-36).

        Ignora tildes y mayúsculas y tolera errores de escritura (`pg_trgm`).
        Orden: (0) sigla o palabra clave exacta, (1) el nombre empieza con el texto,
        (2) el nombre lo contiene, (3) una palabra clave lo contiene, (4) parecido;
        dentro de un nivel, por parecido descendente y luego por nombre.
        """
        sql_text = sql.SQL(
            """
            with q as (select lower(immutable_unaccent(%(q)s)) as t),
            cand as (
                select p.*,
                       lower(immutable_unaccent(p.name)) as n_,
                       lower(immutable_unaccent(coalesce(p.short_name, ''))) as s_,
                       coalesce(
                           (select array_agg(lower(immutable_unaccent(k))) from unnest(p.keywords) k),
                           '{{}}'::text[]
                       ) as k_
                from places p
                where p.is_published
            ),
            ranked as (
                select c.*,
                       case
                           when c.s_ = q.t or q.t = any(c.k_) then 0
                           when starts_with(c.n_, q.t) then 1
                           when position(q.t in c.n_) > 0 then 2
                           when position(q.t in c.s_) > 0
                                or exists (select 1 from unnest(c.k_) k where position(q.t in k) > 0) then 3
                           when length(q.t) >= 3 and (
                                word_similarity(q.t, c.n_) >= 0.3
                                or similarity(q.t, c.s_) >= 0.3
                                or exists (select 1 from unnest(c.k_) k where similarity(q.t, k) >= 0.3)
                           ) then 4
                       end as level_,
                       greatest(
                           word_similarity(q.t, c.n_),
                           similarity(q.t, c.s_),
                           coalesce((select max(similarity(q.t, k)) from unnest(c.k_) k), 0)
                       ) as score_
                from cand c cross join q
            )
            select {cols} from ranked
            where level_ is not null
            order by level_, score_ desc, name, id
            limit %(limit)s
            """
        ).format(cols=_public_columns())
        with self.connection() as conn:
            return list(conn.execute(sql_text, {"q": query, "limit": limit}).fetchall())

    # --- administración de lugares (HU-30) ------------------------------------

    def admin_list_places(
        self,
        category_id: str | None = None,
        published: bool | None = None,
        verified: bool | None = None,
    ) -> list[dict]:
        """Todos los lugares (publicados o no), con campos internos, por nombre."""
        query = sql.SQL(
            "select {cols} from places where "
            "(%(category)s::text is null or category_id = %(category)s) "
            "and (%(published)s::boolean is null or is_published = %(published)s) "
            "and (%(verified)s::boolean is null or (verified_at is not null) = %(verified)s) "
            "order by name, id"
        ).format(cols=_admin_columns())
        params = {"category": category_id, "published": published, "verified": verified}
        with self.connection() as conn:
            return list(conn.execute(query, params).fetchall())

    def admin_get_place(self, place_id: str) -> dict | None:
        query = sql.SQL("select {cols} from places where id = %s").format(cols=_admin_columns())
        with self.connection() as conn:
            return conn.execute(query, (place_id,)).fetchone()

    def category_exists(self, category_id: str) -> bool:
        with self.connection() as conn:
            row = conn.execute("select 1 as x from place_categories where id = %s", (category_id,)).fetchone()
        return row is not None

    def place_exists(self, place_id: str) -> bool:
        with self.connection() as conn:
            return conn.execute("select 1 as x from places where id = %s", (place_id,)).fetchone() is not None

    def would_create_cycle(self, place_id: str, parent_id: str) -> bool:
        """Si poner `parent_id` como contenedor de `place_id` formaría un ciclo."""
        with self.connection() as conn:
            row = conn.execute(
                "with recursive up(id, parent) as ("
                "  select id, parent_place_id from places where id = %(parent)s"
                "  union"
                "  select p.id, p.parent_place_id from places p join up on p.id = up.parent"
                ") select exists(select 1 from up where id = %(place)s) as cycle",
                {"parent": parent_id, "place": place_id},
            ).fetchone()
        return bool(row and row["cycle"])

    def create_place(self, data: dict, verified: bool, username: str) -> dict:
        """Crea un lugar con id incremental y devuelve la fila completa."""
        cols = EDITABLE_PLACE_COLUMNS
        query = sql.SQL(
            "insert into places (id, {cols}, verified_at, updated_by) "
            "values (nextval('places_id_seq')::text, {marks}, "
            "case when %(verified)s then now() end, %(user)s) returning {out}"
        ).format(
            cols=sql.SQL(", ").join(sql.Identifier(c) for c in cols),
            marks=sql.SQL(", ").join(sql.Placeholder(c) for c in cols),
            out=_admin_columns(),
        )
        params = {**{c: data.get(c) for c in cols}, "verified": verified, "user": username}
        with self.connection() as conn:
            return conn.execute(query, params).fetchone()  # type: ignore[return-value]

    def update_place(self, place_id: str, data: dict, verified: bool, username: str) -> dict | None:
        """Reemplaza los campos editables; `None` si el lugar no existe."""
        cols = EDITABLE_PLACE_COLUMNS
        query = sql.SQL(
            "update places set {sets}, "
            "verified_at = case when %(verified)s then coalesce(verified_at, now()) else null end, "
            "updated_at = now(), updated_by = %(user)s where id = %(id)s returning {out}"
        ).format(
            sets=sql.SQL(", ").join(
                sql.SQL("{} = {}").format(sql.Identifier(c), sql.Placeholder(c)) for c in cols
            ),
            out=_admin_columns(),
        )
        params = {**{c: data.get(c) for c in cols}, "verified": verified, "user": username, "id": place_id}
        with self.connection() as conn:
            return conn.execute(query, params).fetchone()

    def admin_list_categories(self) -> list[dict]:
        with self.connection() as conn:
            return list(
                conn.execute(
                    "select c.id, c.label, c.color, c.sort_order, count(p.id)::int as places_count "
                    "from place_categories c left join places p on p.category_id = c.id "
                    "group by c.id order by c.sort_order, c.id"
                ).fetchall()
            )

    def _category_row(self, conn: psycopg.Connection[Any], category_id: str) -> dict:
        return conn.execute(  # type: ignore[return-value]
            "select c.id, c.label, c.color, c.sort_order, count(p.id)::int as places_count "
            "from place_categories c left join places p on p.category_id = c.id "
            "where c.id = %s group by c.id",
            (category_id,),
        ).fetchone()

    def create_category(self, category_id: str, label: str, color: str, sort_order: int | None) -> dict:
        with self.connection() as conn:
            try:
                with conn.transaction():
                    conn.execute(
                        "insert into place_categories (id, label, color, sort_order) values "
                        "(%s, %s, %s, coalesce(%s, (select coalesce(max(sort_order) + 1, 0) from place_categories)))",
                        (category_id, label, color, sort_order),
                    )
            except psycopg.errors.UniqueViolation as exc:
                raise DuplicateError(category_id) from exc
            return self._category_row(conn, category_id)

    def update_category(self, category_id: str, label: str, color: str, sort_order: int | None) -> dict | None:
        with self.connection() as conn:
            row = conn.execute(
                "update place_categories set label = %s, color = %s, sort_order = coalesce(%s, sort_order) "
                "where id = %s returning id",
                (label, color, sort_order, category_id),
            ).fetchone()
            return None if row is None else self._category_row(conn, category_id)

    def delete_category(self, category_id: str) -> tuple[str, int]:
        """`("deleted"|"not_found"|"in_use", n)`; `n` = lugares que la usan."""
        with self.connection() as conn:
            with conn.transaction():
                exists = conn.execute(
                    "select 1 as x from place_categories where id = %s for update", (category_id,)
                ).fetchone()
                if exists is None:
                    return ("not_found", 0)
                n = conn.execute(
                    "select count(*)::int as n from places where category_id = %s", (category_id,)
                ).fetchone()["n"]  # type: ignore[index]
                if n:
                    return ("in_use", n)
                conn.execute("delete from place_categories where id = %s", (category_id,))
                return ("deleted", 0)

    def insert_place_categories(self, rows: list[dict]) -> int:
        """Inserta las categorías que faltan; devuelve cuántas entraron.

        `on conflict do nothing`: una categoría que ya existe no se modifica.
        """
        with self.connection() as conn:
            with conn.transaction():
                return self._insert_missing(
                    conn,
                    "place_categories",
                    ("id", "label", "color", "sort_order"),
                    rows,
                )

    def insert_places(self, rows: list[dict]) -> int:
        """Inserta los lugares que faltan; devuelve cuántos entraron.

        `on conflict do nothing`: un lugar que ya existe conserva sus datos
        (las ediciones hechas después de la carga no se pisan).
        """
        with self.connection() as conn:
            with conn.transaction():
                return self._insert_missing(conn, "places", PLACE_SEED_COLUMNS, rows)

    @staticmethod
    def _insert_missing(
        conn: psycopg.Connection[Any],
        table: str,
        columns: Sequence[str],
        rows: list[dict],
    ) -> int:
        query = sql.SQL(
            "insert into {t} ({cols}) values ({marks}) on conflict (id) do nothing"
        ).format(
            t=sql.Identifier(table),
            cols=sql.SQL(", ").join(sql.Identifier(c) for c in columns),
            marks=sql.SQL(", ").join(sql.Placeholder() for _ in columns),
        )
        inserted = 0
        with conn.cursor() as cur:
            for row in rows:
                cur.execute(query, [row[c] for c in columns])
                inserted += cur.rowcount
        return inserted

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
