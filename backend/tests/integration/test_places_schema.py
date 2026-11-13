"""HU-22: esquema de `place_categories` y `places` contra Postgres real."""

import psycopg
import pytest

pytestmark = pytest.mark.integration

PLACE_COLUMNS = {
    "id", "slug", "name", "short_name", "category_id", "lat", "lng", "keywords",
    "description", "schedule", "detailed_schedule", "phone", "annex", "email",
    "website", "access_hint", "careers", "services", "usage", "image_url",
    "parent_place_id", "is_published", "verified_at", "created_at",
    "updated_at", "updated_by",
}


@pytest.fixture
def conn(test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as connection:
        connection.execute("truncate places, place_categories restart identity cascade")
        connection.execute(
            "insert into place_categories (slug, label, color) values ('facultades', 'Facultades', '#3056ac')"
        )
        yield connection


def _columns(conn, table):
    return {
        name: (nullable, dtype)
        for name, nullable, dtype in conn.execute(
            "select column_name, is_nullable, data_type from information_schema.columns "
            "where table_name = %s",
            (table,),
        ).fetchall()
    }


def _insert(conn, **overrides):
    values = {"slug": "fisi", "name": "FISI", "category_id": 1, "lat": -12.05, "lng": -77.08}
    values.update(overrides)
    cols = ", ".join(values)
    marks = ", ".join(["%s"] * len(values))
    conn.execute(f"insert into places ({cols}) values ({marks})", list(values.values()))


def test_rf_22_1_place_categories_columns(conn):
    cols = _columns(conn, "place_categories")
    assert set(cols) == {"id", "slug", "label", "color", "sort_order"}
    assert cols["id"][1] == "bigint"
    assert all(cols[c][0] == "NO" for c in cols)


def test_rf_22_2_places_has_all_columns_and_types(conn):
    cols = _columns(conn, "places")
    assert set(cols) == PLACE_COLUMNS
    for required in ("id", "slug", "name", "category_id", "lat", "lng", "keywords", "is_published"):
        assert cols[required][0] == "NO", required
    for optional in ("short_name", "description", "schedule", "phone", "annex", "email",
                     "website", "access_hint", "usage", "image_url", "parent_place_id",
                     "verified_at", "updated_by"):
        assert cols[optional][0] == "YES", optional
    assert cols["id"][1] == "bigint"
    assert cols["lat"][1] == "double precision"
    assert cols["keywords"][1] == "ARRAY"


@pytest.mark.parametrize(
    "overrides",
    [
        {"lat": 91},
        {"lat": -91},
        {"lng": 181},
        {"lng": -181},
        {"slug": "Mi Lugar"},
        {"slug": "mi_lugar"},
        {"slug": "-fisi"},
        {"slug": "fisi-"},
        {"name": ""},
        {"category_id": 99999},
        {"parent_place_id": 99999},
    ],
)
def test_rf_22_3_rejects_invalid_rows(conn, overrides):
    with pytest.raises(psycopg.errors.IntegrityError):
        _insert(conn, **overrides)


def test_rf_22_3_rejects_invalid_category_color(conn):
    with pytest.raises(psycopg.errors.CheckViolation):
        conn.execute("insert into place_categories (slug, label, color) values ('x', 'X', 'rojo')")


def test_rf_22_3_accepts_a_valid_parent(conn):
    _insert(conn, slug="campus")
    campus_id = conn.execute("select id from places where slug = 'campus'").fetchone()[0]
    _insert(conn, slug="auditorio", name="Auditorio", parent_place_id=campus_id)


def test_hu_38_ids_are_assigned_by_the_database_and_never_reused(conn):
    _insert(conn, slug="uno")
    _insert(conn, slug="dos")
    first, second = [r[0] for r in conn.execute("select id from places order by id").fetchall()]
    assert second > first
    conn.execute("delete from places where slug = 'dos'")
    _insert(conn, slug="tres")
    assert conn.execute("select id from places where slug = 'tres'").fetchone()[0] > second


def test_hu_38_slug_is_unique_and_a_place_cannot_contain_itself(conn):
    _insert(conn)
    with pytest.raises(psycopg.errors.UniqueViolation):
        _insert(conn)
    own_id = conn.execute("select id from places where slug = 'fisi'").fetchone()[0]
    with pytest.raises(psycopg.errors.CheckViolation):
        conn.execute("update places set parent_place_id = id where id = %s", (own_id,))


def test_rf_22_4_lists_default_to_empty_and_reject_null(conn):
    _insert(conn)
    row = conn.execute(
        "select keywords, detailed_schedule, careers, services, is_published, verified_at "
        "from places where slug = 'fisi'"
    ).fetchone()
    assert row == ([], [], [], [], True, None)
    for column in ("keywords", "detailed_schedule", "careers", "services"):
        with pytest.raises(psycopg.errors.NotNullViolation):
            _insert(conn, slug=f"x-{column.replace('_', '-')}", **{column: None})


def test_hu_39_category_ids_are_numbers_and_slugs_are_unique(conn):
    assert conn.execute("select id from place_categories where slug = 'facultades'").fetchone()[0] == 1
    conn.execute("insert into place_categories (slug, label, color) values ('otra', 'Otra', '#111111')")
    assert conn.execute("select id from place_categories where slug = 'otra'").fetchone()[0] == 2
    with pytest.raises(psycopg.errors.UniqueViolation):
        conn.execute("insert into place_categories (slug, label, color) values ('otra', 'Otra 2', '#111111')")
    with pytest.raises(psycopg.errors.CheckViolation):
        conn.execute("insert into place_categories (slug, label, color) values ('Mala Una', 'M', '#111111')")
