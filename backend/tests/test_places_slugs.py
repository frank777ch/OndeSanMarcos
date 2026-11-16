"""HU-22: slugs de los lugares (sin Postgres)."""

from app.tools.places.slugs import derive_slug, slugify


def test_slugify_removes_accents_and_symbols():
    assert slugify("Facultad de Ingeniería (Nueva)") == "facultad-de-ingenieria-nueva"
    assert slugify("  Puerta 8 ") == "puerta-8"


def test_rf_22_7_derive_slug_uses_the_sigla_or_the_name_and_avoids_collisions():
    assert derive_slug("Facultad de Ingeniería de Sistemas (FISI)", set()) == "fisi"
    assert derive_slug("Facultad de Ciencias Economicas (Antiguo)", set()) == "facultad-de-ciencias-economicas-antiguo"
    assert derive_slug("Puerta 8", set()) == "puerta-8"
    assert derive_slug("Puerta 8", {"puerta-8"}) == "puerta-8-2"
    assert derive_slug("Puerta 8", {"puerta-8", "puerta-8-2"}) == "puerta-8-3"
