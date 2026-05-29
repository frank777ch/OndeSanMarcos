"""Pruebas del enrutamiento automático (HU-2.3) y la intención de navegación."""

import pytest

from app.knowledge.places import get_place_by_id
from app.rag.engine import build_engine
from app.rag.intent import wants_route


@pytest.fixture
def engine():
    return build_engine()


def test_wants_route_detects_navigation_phrases():
    assert wants_route("¿cómo llego al rectorado?")
    assert wants_route("llévame a la biblioteca")
    assert wants_route("dame la ruta al comedor")


def test_wants_route_ignores_plain_questions():
    assert not wants_route("¿a qué hora abre la biblioteca?")
    assert not wants_route("qué es el rectorado")


def test_navigation_query_sets_draw_route_and_destination(engine):
    result = engine.answer("¿cómo llego al rectorado?")
    assert result.draw_route is True
    assert result.destination is not None
    place = get_place_by_id("rectorado")
    assert result.destination.latitude == place.coordinate.latitude
    assert result.destination.longitude == place.coordinate.longitude


def test_plain_place_query_does_not_draw_route(engine):
    result = engine.answer("¿a qué hora abre la biblioteca?")
    assert result.draw_route is False
    assert result.destination is None
    assert any(loc.id == "biblioteca-central" for loc in result.locations)


def test_out_of_scope_query_has_no_route(engine):
    result = engine.answer("dame una receta de ceviche")
    assert result.draw_route is False
    assert result.destination is None
