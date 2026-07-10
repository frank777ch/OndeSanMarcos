"""Tests de la serialización a TypeScript y del armado de payloads de búsqueda.

Herméticos: no se llama a la Places API; sólo se prueban funciones puras.
"""

from __future__ import annotations

import re

from app.knowledge.unmsm_ts import parse_places
from app.tools.maps.fetch_places import build_search_payload, dedupe_by_id
from app.tools.maps.mapping import CampusPlace, Coordinate, render_ts


def _sample_places() -> list[CampusPlace]:
    return [
        CampusPlace(
            id="rectorado",
            name='Rectorado (Edificio "Basadre")',  # comilla que hay que escapar
            coordinate=Coordinate(latitude=-12.0565939, longitude=-77.0862007),
            schedule="Lun–Vie 8:00–16:00",
            keywords=["rectorado", "autoridades"],
            description='Con \\ barra y "comillas".',
            phone="(01) 619-7000",
            detailed_schedule=["lunes: 8:00–16:00"],
        ),
        CampusPlace(
            id="oca",
            name="OCA",
            coordinate=Coordinate(latitude=-12.0518, longitude=-77.0855),
            keywords=["oca", "admision"],
        ),
    ]


def test_render_ts_is_parseable_by_repo_parser():
    ts = render_ts(_sample_places())
    # El parser tolerante del repo (usado en producción) debe leer la salida.
    places = parse_places(ts)
    assert [p.id for p in places] == ["rectorado", "oca"]
    rectorado = places[0]
    assert rectorado.name == 'Rectorado (Edificio "Basadre")'
    assert rectorado.latitude == -12.0565939
    assert rectorado.longitude == -77.0862007
    assert "rectorado" in rectorado.keywords


def test_render_ts_escapes_special_chars():
    ts = render_ts(_sample_places())
    # La barra invertida y las comillas del description quedan escapadas.
    assert r'"Con \\ barra y \"comillas\"."' in ts
    # No debe romperse el módulo: importa el interface curado y declara el array.
    assert 'import type { CampusPlace } from "./unmsm";' in ts
    assert "export const CAMPUS_PLACES: CampusPlace[] = [" in ts


def test_render_ts_omits_empty_optionals():
    ts = render_ts(_sample_places())
    oca_block = ts.split("id: \"oca\"")[1]
    # OCA no trae phone/description/detailedSchedule -> no deben aparecer tras su id.
    assert "phone:" not in oca_block
    assert "description:" not in oca_block
    assert "detailedSchedule:" not in oca_block


def test_render_ts_header_has_caveats_and_timestamp():
    ts = render_ts(_sample_places(), timestamp="2026-07-07T00:00:00Z")
    assert "NO EDITAR A MANO" in ts
    assert "ToS" in ts
    assert "Centroide" in ts
    assert "2026-07-07T00:00:00Z" in ts


def test_render_ts_empty_list_is_valid():
    ts = render_ts([])
    assert "export const CAMPUS_PLACES: CampusPlace[] = [];" in ts
    assert parse_places(ts) == []


def test_render_ts_numbers_round_trip():
    ts = render_ts(_sample_places())
    # La latitud debe emitirse con su precisión completa (no truncada).
    assert "-12.0565939" in ts
    assert not re.search(r"latitude:\s*-12\.056599[^\d]", ts)


# --------------------------------------------------------------------------- #
# Armado de payloads (parte no-red de fetch_places).
# --------------------------------------------------------------------------- #
def test_build_search_payload_restricts_to_campus_rectangle():
    payload = build_search_payload("biblioteca UNMSM")
    assert payload["textQuery"] == "biblioteca UNMSM"
    rect = payload["locationRestriction"]["rectangle"]
    assert rect["low"] == {"latitude": -12.064, "longitude": -77.09}
    assert rect["high"] == {"latitude": -12.049, "longitude": -77.075}
    assert "pageToken" not in payload


def test_build_search_payload_includes_page_token():
    payload = build_search_payload("x", page_token="TOKEN123")
    assert payload["pageToken"] == "TOKEN123"


def test_dedupe_by_id_keeps_first():
    places = [
        {"id": "a", "displayName": {"text": "A1"}},
        {"id": "a", "displayName": {"text": "A2"}},
        {"id": "b", "displayName": {"text": "B"}},
    ]
    unique = dedupe_by_id(places)
    assert [p["id"] for p in unique] == ["a", "b"]
    assert unique[0]["displayName"]["text"] == "A1"  # conserva el primero
