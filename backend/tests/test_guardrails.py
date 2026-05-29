"""Pruebas de los guardrails de alcance."""

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
