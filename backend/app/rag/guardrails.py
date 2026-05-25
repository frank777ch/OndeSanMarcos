"""Guardrails de alcance institucional (HU-2.4).

Limita el asistente a temas de la UNMSM para evitar el uso indebido de la API.
Es la capa determinista; en producción se refuerza con el *system prompt* del
LLM. Si la consulta no parece relacionada con el campus, se declina responder.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.knowledge.places import CAMPUS_PLACES, normalize

OUT_OF_SCOPE_MESSAGE = (
    "Solo puedo ayudarte con temas de la UNMSM: lugares, horarios y "
    "dependencias del campus. ¿Sobre qué lugar de San Marcos quieres saber?"
)

# Vocabulario propio del dominio universitario/campus.
_CAMPUS_VOCABULARY: set[str] = {
    "unmsm",
    "san marcos",
    "sanmarquino",
    "universidad",
    "universitario",
    "campus",
    "ciudad universitaria",
    "facultad",
    "pabellon",
    "aula",
    "laboratorio",
    "oficina",
    "tramite",
    "matricula",
    "decanato",
    "biblioteca",
    "comedor",
    "rectorado",
    "auditorio",
    "estadio",
    "museo",
    "puerta",
}

# Se enriquece con todas las palabras clave de los lugares del campus.
_SCOPE_TERMS: set[str] = {normalize(term) for term in _CAMPUS_VOCABULARY}
for _place in CAMPUS_PLACES:
    for _keyword in _place.keywords:
        _SCOPE_TERMS.add(normalize(_keyword))

# Coincidencia por límite de palabra para evitar falsos positivos: así "aula"
# no se activa dentro de "jaula" ni "ruta" dentro de "frutas". Funciona tanto
# para términos de una palabra como para locuciones ("san marcos").
_SCOPE_REGEX = re.compile(
    r"\b(?:" + "|".join(re.escape(term) for term in sorted(_SCOPE_TERMS)) + r")\b"
)


@dataclass(frozen=True)
class GuardrailResult:
    """Resultado de evaluar el alcance de una consulta."""

    allowed: bool
    reason: str


def is_in_scope(query: str) -> bool:
    """True si la consulta menciona algún término del dominio UNMSM."""
    return _SCOPE_REGEX.search(normalize(query)) is not None


def check(query: str) -> GuardrailResult:
    """Evalúa si la consulta puede ser atendida por el asistente."""
    if is_in_scope(query):
        return GuardrailResult(allowed=True, reason="in_scope")
    return GuardrailResult(allowed=False, reason="out_of_scope")
