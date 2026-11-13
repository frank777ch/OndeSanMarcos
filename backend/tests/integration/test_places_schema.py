"""HU-22: esquema de `place_categories` y `places` contra Postgres real."""

import psycopg
import pytest

pytestmark = pytest.mark.integration

PLACE_COLUMNS = {
    "id", "name", "short_name", "category_id", "lat", "lng", "keywords",
    "description", "schedule", "detailed_schedule", "phone", "annex", "email",
    "website", "access_hint", "careers", "services", "usage", "image_url",
    "parent_place_id", "is_published", "verified_at", "created_at",
    "updated_at", "updated_by",
}


@pytest.fixture
def conn(test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as connection:
        connection.execute("truncate places, place_categories cascade")
        connection.execute(
            "insert into place_categories (id, label, color) values ('facultades', 'Facultades', '#3056ac')"
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
    values = {"id": "fisi", "name": "FISI", "category_id": "facultades", "lat": -12.05, "lng": -77.08}
    values.update(overrides)
    cols = ", ".join(values)
    marks = ", ".join(["%s"] * len(values))
    conn.execute(f"insert into places ({cols}) values ({marks})", list(values.values()))


def test_rf_22_1_place_categories_columns(conn):
    cols = _columns(conn, "place_categories")
    assert set(cols) == {"id", "label", "color", "sort_order"}
    assert all(cols[c][0] == "NO" for c in cols)


def test_rf_22_2_places_has_all_columns_and_types(conn):
    cols = _columns(conn, "places")
    assert set(cols) == PLACE_COLUMNS
    for required in ("id", "name", "category_id", "lat", "lng", "keywords", "is_published"):
        assert cols[required][0] == "NO", required
    for optional in ("short_name", "description", "schedule", "phone", "annex", "email",
                     "website", "access_hint", "usage", "image_url", "parent_place_id",
                     "verified_at", "updated_by"):
        assert cols[optional][0] == "YES", optional
    assert cols["lat"][1] == "double precision"
    assert cols["keywords"][1] == "ARRAY"


@pytest.mark.parametrize(
    "overrides",
    [
        {"lat": 91},
        {"lat": -91},
        {"lng": 181},
        {"lng": -181},
        {"id": "Mi Lugar"},
        {"id": "mi_lugar"},
        {"id": "-fisi"},
        {"id": "fisi-"},
        {"name": ""},
        {"category_id": "no-existe"},
        {"parent_place_id": "fisi"},
    ],
)
def test_rf_22_3_rejects_invalid_rows(conn, overrides):
    with pytest.raises(psycopg.errors.IntegrityError):
        _insert(conn, **overrides)


def test_rf_22_3_rejects_invalid_category_color(conn):
    with pytest.raises(psycopg.errors.CheckViolation):
        conn.execute("insert into place_categories (id, label, color) values ('x', 'X', 'rojo')")


def test_rf_22_3_accepts_a_valid_parent(conn):
    _insert(conn, id="campus")
    _insert(conn, id="auditorio", name="Auditorio", parent_place_id="campus")


def test_rf_22_4_lists_default_to_empty_and_reject_null(conn):
    _insert(conn)
    row = conn.execute(
        "select keywords, detailed_schedule, careers, services, is_published, verified_at "
        "from places where id = 'fisi'"
    ).fetchone()
    assert row == ([], [], [], [], True, None)
    for column in ("keywords", "detailed_schedule", "careers", "services"):
        with pytest.raises(psycopg.errors.NotNullViolation):
            _insert(conn, id=f"x-{column.replace('_', '-')}", **{column: None})
