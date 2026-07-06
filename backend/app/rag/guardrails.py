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
#
# Se mantiene deliberadamente amplio para no desperdiciar la ventaja de la
# búsqueda semántica: si una consulta es plausiblemente sobre la vida
# universitaria (admisión, facultades, trámites, servicios, preuniversitario),
# debe llegar a la recuperación aunque no nombre un lugar exacto. El filtro duro
# solo existe para descartar temas claramente ajenos (deportes, cocina,
# farándula, finanzas) y evitar el uso indebido de la API.
_CAMPUS_VOCABULARY: set[str] = {
    # --- Identidad institucional / campus ---
    "unmsm",
    "san marcos",
    "sanmarquino",
    "universidad",
    "universitario",
    "universitaria",
    "campus",
    "ciudad universitaria",
    "facultad",
    "pabellon",
    "aula",
    "laboratorio",
    "oficina",
    "decanato",
    "biblioteca",
    "comedor",
    "rectorado",
    "auditorio",
    "estadio",
    "museo",
    "puerta",
    "sede",
    # --- Admisión / ingreso / preuniversitario ---
    "admision",
    "postulante",
    "postulacion",
    "prospecto",
    "vacante",
    "vacantes",
    "cepre",
    "cepreunmsm",
    "preparatoria",
    "academia",
    "modalidad",
    "cronograma",
    # --- Estudios / carreras ---
    "carrera",
    "carreras",
    "escuela",
    "escuela profesional",
    "pregrado",
    "posgrado",
    "postgrado",
    "maestria",
    "doctorado",
    "ciclo",
    "semestre",
    "curso",
    "cursos",
    "clase",
    "clases",
    "seccion",
    "syllabus",
    "malla",
    "alumno",
    "estudiante",
    "ingresante",
    # --- Trámites / servicios / bienestar ---
    "tramite",
    "matricula",
    "constancia",
    "certificado",
    "carnet",
    "carne universitario",
    "grado",
    "titulo",
    "bachiller",
    "diploma",
    "beca",
    "becas",
    "bienestar",
    "pension",
    "boleta",
    "record academico",
    "fua",
    "sunedu",
}

# Raíces del dominio a las que se les permite coincidencia por prefijo, para
# absorber la flexión del español (plural, género, conjugación) sin listar cada
# variante. Se eligen raíces específicas del ámbito universitario que no chocan
# con palabras comunes fuera de dominio.
_CAMPUS_STEMS: set[str] = {
    "admisi",  # admisión, admisiones
    "postul",  # postular, postulante, postulación
    "preuniversitari",  # preuniversitario, preuniversitaria, preuniversitarios
    "matricul",  # matrícula, matricularse, matriculado
    "tramit",  # trámite, tramitar
    "examen",  # examen, exámenes
    "ingres",  # ingreso, ingresar, ingresante
    "estudi",  # estudio, estudiar, estudiante, estudios
    "constanci",  # constancia, constancias
    "certifica",  # certificado, certificación, certificar
    "facultad",  # facultad, facultades
    "profesor",  # profesor, profesores, profesora
    "carrera",  # carrera, carreras
    "vacante",  # vacante, vacantes
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

# Coincidencia por prefijo anclada al inicio de palabra: la raíz debe empezar
# una palabra (`\b`) y puede continuar con más letras (`[a-z]*`). Así "ingres"
# reconoce "ingreso"/"ingresar"/"ingresante" sin dispararse en mitad de otra
# palabra.
_STEM_REGEX = re.compile(
    r"\b(?:"
    + "|".join(re.escape(normalize(stem)) for stem in sorted(_CAMPUS_STEMS))
    + r")[a-z]*\b"
)


@dataclass(frozen=True)
class GuardrailResult:
    """Resultado de evaluar el alcance de una consulta."""

    allowed: bool
    reason: str


def is_in_scope(query: str) -> bool:
    """True si la consulta menciona algún término del dominio UNMSM.

    Combina dos señales léxicas sobre la consulta normalizada (minúsculas y sin
    tildes): (1) términos y locuciones exactas del vocabulario/lugares y (2)
    raíces del dominio con coincidencia por prefijo para tolerar la flexión.
    """
    normalized = normalize(query)
    return (
        _SCOPE_REGEX.search(normalized) is not None
        or _STEM_REGEX.search(normalized) is not None
    )


def check(query: str) -> GuardrailResult:
    """Evalúa si la consulta puede ser atendida por el asistente."""
    if is_in_scope(query):
        return GuardrailResult(allowed=True, reason="in_scope")
    return GuardrailResult(allowed=False, reason="out_of_scope")
