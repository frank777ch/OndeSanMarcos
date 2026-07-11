"""Tests del mapeo Places (New) -> CampusPlace y de la generación de ids.

Herméticos: usan una fixture SINTÉTICA, nunca la Places API real.
"""

from __future__ import annotations

from app.tools.maps.mapping import (
    assign_unique_ids,
    derive_keywords,
    map_raw_place,
    map_raw_places,
    slugify,
)

# --------------------------------------------------------------------------- #
# Fixture sintética (shape de Places API New). Rectángulo del campus:
# lat ∈ [-12.064, -12.049], lng ∈ [-77.09, -77.075].
# --------------------------------------------------------------------------- #
RAW_INSIDE = {
    "id": "ChIJ_rectorado",
    "displayName": {"text": "Rectorado (Edificio Jorge Basadre)", "languageCode": "es"},
    "location": {"latitude": -12.0565939, "longitude": -77.0862007},
    "types": ["local_government_office", "point_of_interest", "establishment"],
    "nationalPhoneNumber": "(01) 619-7000",
    "internationalPhoneNumber": "+51 1 6197000",
    "editorialSummary": {"text": "Sede de las autoridades \"centrales\".", "languageCode": "es"},
    "regularOpeningHours": {
        "weekdayDescriptions": [
            "lunes: 8:00–16:00",
            "martes: 8:00–16:00",
        ]
    },
}

RAW_NO_HOURS = {
    "id": "ChIJ_oca",
    "displayName": {"text": "Oficina Central de Admisión", "languageCode": "es"},
    "location": {"latitude": -12.0518, "longitude": -77.0855},
    "types": ["university"],
}

RAW_OUTSIDE = {
    "id": "ChIJ_faraway",
    "displayName": {"text": "Plaza San Martín", "languageCode": "es"},
    "location": {"latitude": -12.0500, "longitude": -77.0340},  # lng fuera del campus
    "types": ["tourist_attraction"],
}

RAW_NO_NAME = {
    "id": "ChIJ_anon",
    "location": {"latitude": -12.056, "longitude": -77.083},
    "types": ["establishment"],
}


def test_slugify_strips_accents_and_spaces():
    assert slugify("Oficina Central de Admisión") == "oficina-central-de-admision"
    assert slugify("  Café / Bar  ") == "cafe-bar"
    assert slugify("¡Hola!!!") == "hola"


def test_slugify_empty_falls_back():
    assert slugify("···") == "lugar"


def test_assign_unique_ids_dedupes_on_collision():
    names = ["Aula Magna", "Aula Magna", "Aula, Magna", "Biblioteca"]
    ids = assign_unique_ids(names)
    assert ids == ["aula-magna", "aula-magna-2", "aula-magna-3", "biblioteca"]
    assert len(set(ids)) == len(ids)  # únicos


def test_derive_keywords_accent_insensitive_and_types():
    kws = derive_keywords("Oficina Central de Admisión", ["university", "point_of_interest"])
    assert "oficina central de admision" in kws  # nombre completo normalizado
    assert "admision" in kws  # token sin tilde
    assert "university" in kws  # type legible
    assert "de" not in kws  # stopword filtrada
    assert "point of interest" not in kws  # type de ruido filtrado
    assert len(kws) == len(set(kws))  # sin duplicados


def test_map_raw_place_full_fields():
    place = map_raw_place(RAW_INSIDE, "rectorado")
    assert place.id == "rectorado"
    assert place.name == "Rectorado (Edificio Jorge Basadre)"
    assert place.coordinate.latitude == -12.0565939
    assert place.coordinate.longitude == -77.0862007
    assert place.phone == "(01) 619-7000"  # nacional preferido
    assert place.description == 'Sede de las autoridades "centrales".'
    assert place.detailed_schedule == ["lunes: 8:00–16:00", "martes: 8:00–16:00"]
    assert place.schedule == "lunes: 8:00–16:00 · martes: 8:00–16:00"
    assert "rectorado" in " ".join(place.keywords)


def test_map_raw_place_without_hours_or_optionals():
    place = map_raw_place(RAW_NO_HOURS, "oca")
    assert place.schedule == ""
    assert place.detailed_schedule == []
    assert place.phone == ""
    assert place.description == ""


def test_map_raw_places_filters_bounds_and_missing_names():
    result = map_raw_places([RAW_INSIDE, RAW_NO_HOURS, RAW_OUTSIDE, RAW_NO_NAME])
    ids = [p.id for p in result]
    # RAW_OUTSIDE (fuera del rectángulo) y RAW_NO_NAME (sin nombre) se descartan.
    # El id es el slug del nombre completo.
    assert ids == ["rectorado-edificio-jorge-basadre", "oficina-central-de-admision"]


def test_map_raw_places_can_disable_bounds_filter():
    result = map_raw_places([RAW_OUTSIDE], restrict_to_bounds=False)
    assert [p.name for p in result] == ["Plaza San Martín"]
