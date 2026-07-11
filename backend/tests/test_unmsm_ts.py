"""Tests del parser de `unmsm.ts` (sin runtime TS, sin red)."""

from __future__ import annotations

from app.knowledge.unmsm_ts import load_map_places, parse_places

# Fragmento sintético con los casos peliagudos: comentarios, comilla escapada
# dentro de un string, "//" dentro de un string, coordenada anidada, y un
# `export const` posterior que NO debe mezclarse con los lugares.
SNIPPET = """
export const CAMPUS_PLACES: CampusPlace[] = [
  // ADMINISTRACIÓN
  {
    id: "rectorado",
    name: "Rectorado (Edificio \\"Basadre\\")",
    schedule: "Lun–Vie 8:00–16:00",
    keywords: ["rectorado", "rector"],
    coordinate: { latitude: -12.0566, longitude: -77.0862 },
  },
  {
    id: "oca",
    name: "OCA",
    keywords: ["oca", "admision"],
    description: "Gestiona admisión. Nota con // dentro del string.",
    careers: ["derecho", "economia"],
    coordinate: { latitude: -12.05, longitude: -77.08 },
  },
];
export const UNMSM_POIS = { foo: { id: "no-soy-lugar" } };
"""


def test_parse_extracts_ids_in_order():
    places = parse_places(SNIPPET)
    assert [p.id for p in places] == ["rectorado", "oca"]


def test_parse_fields_and_escapes():
    rectorado, oca = parse_places(SNIPPET)
    assert rectorado.name == 'Rectorado (Edificio "Basadre")'
    assert rectorado.keywords == ("rectorado", "rector")
    assert rectorado.latitude == -12.0566
    assert rectorado.longitude == -77.0862
    assert not rectorado.has_description

    assert oca.has_description
    assert oca.careers == ("derecho", "economia")


def test_does_not_leak_pois_after_array():
    ids = [p.id for p in parse_places(SNIPPET)]
    assert "no-soy-lugar" not in ids


def test_real_unmsm_ts_has_known_places():
    places = load_map_places()
    ids = {p.id for p in places}
    assert {"rectorado", "oca", "biblioteca-central"} <= ids
    assert len(places) >= 30
