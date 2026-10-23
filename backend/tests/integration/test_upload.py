"""RF-23.11: contar, reemplazar por lugar y listar lugares."""

import pytest

from tests.integration.conftest import row, vec

pytestmark = pytest.mark.integration


def test_count_place_and_place_ids(db):
    db.insert_rows([row("a1", "a", vec(0)), row("a2", "a", vec(1)), row("b1", "b", vec(2))])
    assert db.count_place("a") == 2
    assert db.count_place("b") == 1
    assert db.count_place("zzz") == 0
    assert db.place_ids() == {"a", "b"}


def test_replace_place_replaces_only_that_place(db):
    db.insert_rows([row("a1", "a", vec(0)), row("a2", "a", vec(1)), row("b1", "b", vec(2))])

    db.replace_place("a", [row("a-nuevo", "a", vec(3))])

    assert db.count_place("a") == 1
    assert db.count_place("b") == 1
    assert db.count() == 2


def test_replace_place_on_a_new_place_just_inserts(db):
    db.replace_place("nuevo", [row("n1", "nuevo", vec(0)), row("n2", "nuevo", vec(1))])
    assert db.count_place("nuevo") == 2
