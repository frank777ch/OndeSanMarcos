"""Pruebas de los guardrails de alcance."""

import pytest

from app.rag import guardrails


def test_campus_query_is_in_scope():
    assert guardrails.check("¿Cómo llego al rectorado?").allowed
    assert guardrails.is_in_scope("horario de la biblioteca")


def test_off_topic_query_is_out_of_scope():
    assert not guardrails.check("dame una receta de ceviche").allowed
    assert not guardrails.is_in_scope("qué película veo hoy")


def test_word_boundary_avoids_false_positives():
    # "aula" no debe activarse dentro de "jaula".
    assert not guardrails.is_in_scope("tengo una jaula para mi loro")
    # "ruta" no debe activarse dentro de "frutas".
    assert not guardrails.is_in_scope("quiero comprar frutas")


def test_multiword_terms_are_in_scope():
    assert guardrails.is_in_scope("información sobre san marcos")
    assert guardrails.is_in_scope("dónde está la ciudad universitaria")


# --- Consultas semánticas de dominio que antes bloqueaba el guardrail ---
#
# Estas son legítimamente sobre la vida universitaria (admisión, estudios,
# preuniversitario, trámites) pero no nombran un lugar exacto del corpus. La
# relajación por vocabulario ampliado + coincidencia por raíz debe dejarlas
# pasar a la recuperación semántica.
@pytest.mark.parametrize(
    "query",
    [
        "examen de ingreso",
        "¿dónde me preparo para el examen de ingreso?",
        "dónde estudio derecho",
        "preparación preuniversitaria",
        "trámite de constancia",
        "¿dónde postulo a la universidad?",
        "¿qué carreras ofrece la universidad?",
        "necesito una constancia de estudios",
        "¿cómo me matriculo este ciclo?",
        "vacantes de admisión 2026",
        "quiero un certificado de estudios",
        "¿dónde puedo tramitar mi carnet universitario?",
    ],
)
def test_domain_semantic_queries_now_in_scope(query):
    assert guardrails.is_in_scope(query), query
    assert guardrails.check(query).allowed


# --- Consultas claramente ajenas: deben seguir siendo declinadas ---
@pytest.mark.parametrize(
    "query",
    [
        "quién ganó el mundial",
        "precio del dólar hoy",
        "cómo cocinar arroz chaufa",
        "dame una receta de ceviche",
        "qué película veo hoy",
        "quiero comprar carne para la parrilla",
        "cuál es la capital de Francia",
        "recomiéndame una canción",
    ],
)
def test_off_topic_queries_still_declined(query):
    assert not guardrails.is_in_scope(query), query
    assert not guardrails.check(query).allowed


def test_stem_matching_tolerates_inflection():
    # La raíz "ingres" reconoce sus flexiones...
    assert guardrails.is_in_scope("cuándo es el ingreso")
    assert guardrails.is_in_scope("quiero ingresar a san marcos")
    assert guardrails.is_in_scope("soy ingresante")
    # ...pero la raíz debe empezar la palabra (no en mitad de otra).
    assert not guardrails.is_in_scope("progresar en la vida")
