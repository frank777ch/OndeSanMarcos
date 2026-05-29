"""Corpus de documentos institucionales (datos de ejemplo).

Simula la base de conocimiento oficial que en producción vivirá en Supabase
(pgvector) e ingerirá LlamaIndex. Aquí se usa para que el motor RAG funcione
de forma aislada: el retriever indexa estos documentos y el LLM mock genera
respuestas ancladas a ellos.

Cada `Document` puede asociarse a un lugar (`place_id`) para enriquecer las
`locations` devueltas al frontend.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Document:
    """Documento de la base de conocimiento."""

    id: str
    title: str
    text: str
    place_id: str | None = None


DOCUMENTS: list[Document] = [
    Document(
        id="doc-rectorado",
        title="Rectorado de la UNMSM",
        place_id="rectorado",
        text=(
            "El Rectorado es la sede de la administración central de la "
            "Universidad Nacional Mayor de San Marcos. Atiende trámites de "
            "alta dirección de lunes a viernes de 8:00 a 17:00. Se ubica en "
            "la zona central de la Ciudad Universitaria."
        ),
    ),
    Document(
        id="doc-comedor",
        title="Comedor Universitario",
        place_id="comedor-universitario",
        text=(
            "El Comedor Universitario ofrece almuerzo a la comunidad "
            "sanmarquina de lunes a viernes de 12:00 a 14:30. El servicio "
            "está subvencionado para estudiantes registrados en el programa "
            "de bienestar."
        ),
    ),
    Document(
        id="doc-biblioteca",
        title="Biblioteca Central Pedro Zulen",
        place_id="biblioteca-central",
        text=(
            "La Biblioteca Central Pedro Zulen brinda servicios de lectura, "
            "préstamo de libros y salas de estudio de lunes a sábado de 8:00 "
            "a 21:00. Cuenta con colecciones físicas y acceso a recursos "
            "digitales para investigación."
        ),
    ),
    Document(
        id="doc-fisi",
        title="Facultad de Ingeniería de Sistemas e Informática",
        place_id="fisi",
        text=(
            "La Facultad de Ingeniería de Sistemas e Informática (FISI) forma "
            "profesionales en ingeniería de sistemas y de software. Sus "
            "instalaciones y laboratorios atienden de lunes a viernes de 7:00 "
            "a 22:00."
        ),
    ),
    Document(
        id="doc-auditorio",
        title="Auditorio Ela Dunbar Temple",
        place_id="auditorio-ela-dunbar-temple",
        text=(
            "El Auditorio Ela Dunbar Temple alberga ceremonias, conferencias "
            "y eventos académicos. Su disponibilidad depende de la "
            "programación institucional de eventos."
        ),
    ),
    Document(
        id="doc-estadio",
        title="Estadio Universitario",
        place_id="estadio",
        text=(
            "El Estadio Universitario es el principal espacio deportivo del "
            "campus. Se usa para fútbol, atletismo y actividades recreativas, "
            "abierto todos los días de 6:00 a 20:00."
        ),
    ),
    Document(
        id="doc-museo",
        title="Museo de Historia Natural",
        place_id="museo-historia-natural",
        text=(
            "El Museo de Historia Natural de la UNMSM conserva colecciones de "
            "flora, fauna y geología del Perú. Recibe visitas de martes a "
            "domingo de 9:00 a 15:00."
        ),
    ),
    Document(
        id="doc-campus",
        title="Sobre el campus de San Marcos",
        place_id=None,
        text=(
            "La Ciudad Universitaria de la UNMSM se encuentra en Lima y reúne "
            "facultades, bibliotecas, comedores, áreas deportivas y oficinas "
            "administrativas. Es la universidad más antigua de América."
        ),
    ),
]
