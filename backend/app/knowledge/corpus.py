"""Corpus de documentos institucionales de la UNMSM.

Base de conocimiento del asistente. En modo mock el retriever indexa estos
documentos y el LLM genera respuestas ancladas a ellos; en producción, el mismo
contenido se ingerirá a la base vectorial (Postgres + pgvector).

Fuente: `app/knowledge/sources/unmsm_info.md` (documento oficial verificado por
el equipo). Cada `Document` puede asociarse a un lugar (`place_id` de
`app/knowledge/places.py`) para enriquecer las `locations` devueltas al frontend.
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
    # =============== GENERAL ===============
    Document(
        id="doc-campus",
        title="Sobre la UNMSM y su campus",
        place_id=None,
        text=(
            "La Universidad Nacional Mayor de San Marcos (UNMSM), \"Decana de "
            "América\", fue fundada el 12 de mayo de 1551 y es la universidad "
            "más antigua de América. Su sede principal es la Ciudad "
            "Universitaria, en Av. Germán Amézaga 375, Lima. Teléfono central "
            "(01) 619-7000; web www.unmsm.edu.pe. Tiene 20 facultades (17 en la "
            "Ciudad Universitaria y 3 en sedes externas). Se ingresa al campus "
            "por la Puerta 1 (Av. Universitaria Sur), la Puerta 2 (Av. "
            "Venezuela), la Puerta 3 o Amézaga (Av. Germán Amézaga) y la "
            "Puerta 7 (Av. Óscar R. Benavides / Colonial)."
        ),
    ),
    Document(
        id="doc-sedes",
        title="Sedes de la UNMSM",
        place_id=None,
        text=(
            "La UNMSM tiene tres sedes. La Ciudad Universitaria (Av. Germán "
            "Amézaga 375, Lima) reúne 17 facultades. El Campus San Fernando "
            "(Av. Miguel Grau 755, Lima) alberga Medicina Humana —con "
            "Obstetricia, Enfermería, Nutrición y Tecnología Médica— y Farmacia "
            "y Bioquímica. El Campus San Borja (Av. Circunvalación 28) alberga "
            "Medicina Veterinaria."
        ),
    ),
    # =============== SERVICIOS DEL CAMPUS ===============
    Document(
        id="doc-farmacia",
        title="Farmacia Universitaria UNMSM",
        place_id=None,
        text=(
            "La Farmacia Universitaria UNMSM está al costado de la Clínica "
            "Universitaria (se ingresa por la Puerta 5) y atiende de lunes a "
            "viernes de 8:30 a 16:00. Es la primera farmacia universitaria del "
            "Perú y vende medicamentos genéricos a bajo costo para la comunidad "
            "universitaria y el público."
        ),
    ),
    Document(
        id="doc-salud-mental",
        title="Centro de Salud Mental UNMSM",
        place_id=None,
        text=(
            "El Centro de Salud Mental UNMSM se ubica en la Av. Universitaria "
            "s/n de la Ciudad Universitaria y brinda servicios de psicología y "
            "psiquiatría a estudiantes de pregrado y posgrado, docentes, "
            "administrativos, familiares y vecinos de la zona."
        ),
    ),
    Document(
        id="doc-transporte",
        title="Transporte Universitario",
        place_id=None,
        text=(
            "La UNMSM ofrece transporte gratuito. El bus interno, llamado "
            "\"Burrito\", recorre el perímetro de la Ciudad Universitaria de "
            "lunes a viernes de 7:30 a 18:00, con paradas cerca de las puertas "
            "principales. El bus externo gratuito sale desde los conos norte, "
            "sur y este y del centro de Lima a las 6:20 am y regresa por la "
            "tarde desde la explanada cercana a la Facultad de Derecho."
        ),
    ),
    # =============== CAFETERÍAS ===============
    Document(
        id="doc-cafeterias",
        title="Cafeterías del campus",
        place_id=None,
        text=(
            "En la Ciudad Universitaria hay cafeterías en la Facultad de "
            "Ingeniería Química (lunes a sábado de 9:00 a 21:00), la Facultad "
            "de Ingeniería Civil, la Facultad de Odontología, la Facultad de "
            "Ingeniería Industrial y la Clínica Universitaria (Cafetería "
            "Fluidos). Ofrecen almuerzos, snacks, bebidas y postres."
        ),
    ),
    # =============== FACULTADES EN SEDES EXTERNAS ===============
    Document(
        id="doc-medicina",
        title="Facultad de Medicina «San Fernando»",
        place_id=None,
        text=(
            "La Facultad de Medicina \"San Fernando\" NO está en la Ciudad "
            "Universitaria: se ubica en la Av. Miguel Grau 755, en el distrito "
            "de Lima (Barrios Altos), a unos 5 km del campus principal. Ofrece "
            "las carreras de Medicina Humana, Obstetricia, Enfermería, "
            "Tecnología Médica y Nutrición, y atiende de lunes a viernes de "
            "7:00 a 20:00."
        ),
    ),
    Document(
        id="doc-farmacia-bioquimica",
        title="Facultad de Farmacia y Bioquímica (FFB)",
        place_id=None,
        text=(
            "La Facultad de Farmacia y Bioquímica (FFB) está en el Campus San "
            "Fernando, en el Jr. Huanta 1182, Lima, y no en el campus "
            "principal. Ofrece las carreras de Farmacia y Bioquímica, Ciencias "
            "de los Alimentos y Toxicología."
        ),
    ),
    Document(
        id="doc-veterinaria",
        title="Facultad de Medicina Veterinaria (FMV)",
        place_id=None,
        text=(
            "La Facultad de Medicina Veterinaria (FMV) está en la Av. "
            "Circunvalación 28, San Borja, a unos 8 km del campus principal. "
            "Cuenta con la Clínica de Animales Menores (CAMe) para la atención "
            "de mascotas."
        ),
    ),
    # =============== PREGUNTAS FRECUENTES ===============
    Document(
        id="doc-faq-ingreso",
        title="Preguntas frecuentes: ingreso y costos",
        place_id=None,
        text=(
            "A los ingresantes o estudiantes de primer año se les llama "
            "\"cachimbos\". La UNMSM es una universidad pública y no cobra "
            "matrícula en la mayoría de las facultades; el comedor, el "
            "transporte interno y el gimnasio son gratuitos para los "
            "estudiantes matriculados. Se ingresa principalmente por el examen "
            "de admisión (dos veces al año, aproximadamente en marzo y "
            "septiembre), y también por ingreso directo para egresados con "
            "título, traslados y el CEPREUNMSM."
        ),
    ),
    Document(
        id="doc-faq-visitantes",
        title="Preguntas frecuentes: visitantes y accesos",
        place_id=None,
        text=(
            "El campus tiene acceso controlado, pero el público general puede "
            "ingresar presentando su DNI en las puertas; no es necesario ser "
            "estudiante para usar la Biblioteca Central o la Clínica. Hay WiFi "
            "universitario en varios puntos del campus. Para llegar en "
            "transporte público se puede usar el Metropolitano por la Av. "
            "Brasil o la Av. Venezuela, o las rutas de bus por las avenidas "
            "Venezuela, Colonial y Universitaria; la puerta de referencia es la "
            "Puerta Amézaga."
        ),
    ),
]
