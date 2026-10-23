"""RF-23.9: búsqueda por similitud con vectores conocidos."""

import pytest

from tests.integration.conftest import row, vec

pytestmark = pytest.mark.integration


def test_match_orders_by_cosine_similarity(db):
    db.insert_rows(
        [
            row("cerca", "a", vec(0)),
            row("medio", "b", [0.6 if i == 0 else 0.8 if i == 1 else 0.0 for i in range(768)]),
            row("lejos", "c", vec(5)),
        ]
    )

    result = db.match(vec(0), 3)

    assert [r["content"] for r in result] == ["cerca", "medio", "lejos"]
    assert result[0]["similarity"] == pytest.approx(1.0)
    assert result[1]["similarity"] == pytest.approx(0.6)
    assert result[2]["similarity"] == pytest.approx(0.0, abs=1e-6)


def test_match_returns_the_documented_row_shape(db):
    db.insert_rows([row("hola", "a", vec(0))])

    (result,) = db.match(vec(0), 4)

    assert set(result) == {"id", "content", "metadata", "similarity"}
    assert result["metadata"]["place_id"] == "a"


def test_match_respects_the_limit(db):
    db.insert_rows([row(f"r{i}", f"p{i}", vec(i)) for i in range(5)])
    assert len(db.match(vec(0), 2)) == 2
