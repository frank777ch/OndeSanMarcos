"""Corpus de documentos institucionales de la UNMSM.

Base de conocimiento del asistente. En modo mock el retriever indexa estos
documentos y el LLM genera respuestas ancladas a ellos; en producción, el mismo
contenido se ingerirá a la base vectorial (Supabase + pgvector).

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
        id="doc-biblioteca",
        title="Biblioteca Central Pedro Zulen",
        place_id="biblioteca-central",
        text=(
            "La Biblioteca Central Pedro Zulen tiene horario de lunes a viernes "
            "de 7:30 a 20:00 y sábados de 8:00 a 17:00. Se ubica en la Plaza "
            "Cívica de la Ciudad Universitaria (Av. Amézaga 375). Es la "
            "biblioteca universitaria más grande del Perú (19,800 m² y cinco "
            "niveles) y requiere carné de biblioteca para ingresar. Ofrece "
            "préstamo de libros, sala de tesis, hemeroteca, sala de cómputo con "
            "internet, cubículos de trabajo y el repositorio digital "
            "Cybertesis. El carné se paga en la plataforma San Market y se "
            "recoge en la propia biblioteca."
        ),
    ),
    Document(
        id="doc-comedor",
        title="Comedor Universitario",
        place_id="comedor-universitario",
        text=(
            "El Comedor Universitario de la Ciudad Universitaria atiende de "
            "lunes a viernes: desayuno a las 7:00 (sin ticket), almuerzo de "
            "12:00 a 13:40 (con ticket) y cena de 17:00 a 18:00 (con ticket); "
            "los sábados de 7:00 a 15:00. Es gratuito para estudiantes de "
            "pregrado matriculados y tiene costo para docentes y "
            "administrativos. Los tickets se obtienen de forma presencial en el "
            "Comedor, en la Facultad de Psicología y en la Puerta 1, o en línea "
            "por el Portal UNMSM. Sirve hasta 2,600 almuerzos por turno; a las "
            "largas colas se les llama \"el gusaneo\"."
        ),
    ),
    Document(
        id="doc-clinica",
        title="Clínica Universitaria UNMSM",
        place_id="clinica-universitaria",
        text=(
            "La Clínica Universitaria UNMSM está en la Av. Jorge Basadre "
            "Grohmann s/n de la Ciudad Universitaria y atiende de lunes a "
            "sábado de 8:00 a 20:00. Ofrece medicina general, oftalmología, "
            "ginecología, psiquiatría, dermatología, odontología, nutrición, "
            "traumatología, radiología y cardiología, además de laboratorio "
            "clínico, rayos X y ecografía. Atiende a estudiantes, docentes, "
            "administrativos, jubilados y a la comunidad vecina. La consulta de "
            "medicina general cuesta desde S/5 para estudiantes sanmarquinos y "
            "las citas se dan por orden de llegada."
        ),
    ),
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
        id="doc-residencia",
        title="Residencia Universitaria",
        place_id="residencia-universitaria",
        text=(
            "La Residencia Universitaria de la Ciudad Universitaria es vivienda "
            "para estudiantes de pregrado de escasos recursos y se gestiona a "
            "través de la Oficina General de Bienestar Universitario (OGBU); la "
            "atención administrativa es de lunes a viernes de 8:00 a 16:00. "
            "Incluye biblioteca, sala de cómputo, cocina, sala de visitas y "
            "lavandería. La convocatoria es anual, aproximadamente en marzo y "
            "abril, y se consulta en ogbu.unmsm.edu.pe."
        ),
    ),
    Document(
        id="doc-estadio",
        title="Estadio Olímpico de San Marcos",
        place_id="estadio-universitario",
        text=(
            "El Estadio Olímpico de San Marcos está en la zona central del "
            "campus y tiene capacidad para unos 32,000 espectadores. Cuenta con "
            "pista atlética y campo de fútbol, y también es sede de grandes "
            "conciertos internacionales. Su acceso está sujeto a la "
            "programación de eventos y actividades universitarias."
        ),
    ),
    Document(
        id="doc-gimnasio",
        title="Coliseo Deportivo y Gimnasio UNMSM",
        place_id="gimnasio-universitario",
        text=(
            "El Coliseo Deportivo y Gimnasio UNMSM está cerca de la Facultad de "
            "Ingeniería Industrial y atiende de lunes a viernes de 6:00 a 23:00 "
            "y sábados de 6:00 a 16:30. Su uso es gratuito para la comunidad "
            "sanmarquina e incluye canchas de fútbol, vóley y básquet, y una "
            "zona de pesas y equipos de ejercicio."
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
    Document(
        id="doc-posgrado",
        title="Escuela de Posgrado (DGEP)",
        place_id="posgrado",
        text=(
            "La Escuela de Posgrado (DGEP) está en la Av. Amézaga de la Ciudad "
            "Universitaria y atiende de lunes a viernes de 8:00 a 20:00. Ofrece "
            "130 programas de maestría, 34 de doctorado y 133 de segundas "
            "especialidades en las cinco áreas del conocimiento de la "
            "universidad."
        ),
    ),
    Document(
        id="doc-cepre",
        title="Centro Preuniversitario UNMSM (CEPREUNMSM)",
        place_id="cepreunmsm",
        text=(
            "El Centro Preuniversitario UNMSM (CEPREUNMSM) está en la Av. "
            "Amézaga 60, dentro de la Ciudad Universitaria, y es la academia "
            "preparatoria oficial de la universidad. Prepara a los postulantes "
            "para el examen de admisión; los alumnos que ocupan una vacante en "
            "el cuadro de méritos ingresan a la UNMSM sin rendir el examen "
            "ordinario. Más información en cepre.unmsm.edu.pe."
        ),
    ),
    Document(
        id="doc-oca",
        title="Oficina Central de Admisión (OCA)",
        place_id="oca",
        text=(
            "La Oficina Central de Admisión (OCA) atiende de lunes a viernes de "
            "9:00 a 16:00 y gestiona todos los procesos de admisión de la "
            "UNMSM: examen ordinario, traslado interno y externo, ingreso "
            "directo para egresados y la modalidad PIR, entre otros. La "
            "universidad realiza dos exámenes de admisión al año, "
            "aproximadamente en marzo y septiembre."
        ),
    ),
    # =============== PATRIMONIO ===============
    Document(
        id="doc-huaca",
        title="Huaca San Marcos",
        place_id="huaca-san-marcos",
        text=(
            "La Huaca San Marcos es un monumento arqueológico prehispánico "
            "ubicado dentro de la Ciudad Universitaria, en el lado oeste cerca "
            "de la Av. Venezuela. Es una gran estructura ceremonial construida "
            "por la Cultura Lima a partir del siglo V d.C., con ocupación "
            "posterior de las culturas Ichma e Inca. El acceso es libre para "
            "los universitarios y está protegida por ley, por lo que no debe "
            "deteriorarse."
        ),
    ),
    # =============== AUDITORIOS ===============
    Document(
        id="doc-auditorio-ella",
        title="Auditorio Ella Dunbar Temple",
        place_id="auditorio-ella-dunbar-temple",
        text=(
            "El Auditorio Ella Dunbar Temple está en la zona central-norte del "
            "campus y tiene unas 400 butacas. Se usa para ceremonias de "
            "graduación, conferencias y eventos académicos y culturales de gran "
            "escala, con equipamiento de videoconferencia, proyección y sonido "
            "profesional. Su disponibilidad depende de la programación de "
            "eventos."
        ),
    ),
    Document(
        id="doc-auditorio-rosa",
        title="Auditorio Rosa Alarco Larraburre",
        place_id="auditorio-rosa-alarco",
        text=(
            "El Auditorio Rosa Alarco Larraburre, en la Ciudad Universitaria, "
            "se usa para conferencias, charlas, seminarios y eventos de escala "
            "mediana, según la programación institucional."
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
    # =============== FACULTADES ===============
    Document(
        id="doc-fisi",
        title="Facultad de Ingeniería de Sistemas e Informática (FISI)",
        place_id="fisi",
        text=(
            "La Facultad de Ingeniería de Sistemas e Informática (FISI) está en "
            "la Av. Amézaga, en el extremo norte del campus, y atiende de lunes "
            "a sábado de 8:00 a 22:00. Ofrece las carreras de Ingeniería de "
            "Sistemas e Ingeniería de Software y es una de las mejores "
            "facultades de informática del Perú, con trabajo en inteligencia "
            "artificial, ciencia de datos, ciberseguridad y laboratorios de "
            "cómputo modernos."
        ),
    ),
    Document(
        id="doc-fic",
        title="Facultad de Ingeniería Civil (FIC)",
        place_id="fic",
        text=(
            "La Facultad de Ingeniería Civil (FIC) ofrece la carrera de "
            "Ingeniería Civil y cuenta con laboratorios de estructuras, "
            "geotecnia e hidráulica. Su cafetería es una de las más populares "
            "del campus."
        ),
    ),
    Document(
        id="doc-fiee",
        title="Facultad de Ingeniería Electrónica y Eléctrica (FIEE)",
        place_id="fiee",
        text=(
            "La Facultad de Ingeniería Electrónica y Eléctrica (FIEE) ofrece "
            "las carreras de Ingeniería Electrónica, Eléctrica, de "
            "Telecomunicaciones y Biomédica. Su pabellón nuevo tiene acceso "
            "para personas con discapacidad, sala de estudio y comedor, además "
            "de laboratorios de electrónica, telecomunicaciones y biomédica."
        ),
    ),
    Document(
        id="doc-figmmg",
        title="Facultad de Ingeniería Geológica, Minera y Metalúrgica (FIGMMG)",
        place_id="figmmg",
        text=(
            "La Facultad de Ingeniería Geológica, Minera y Metalúrgica "
            "(FIGMMG) ofrece las carreras de Ingeniería Geológica, de Minas, "
            "Metalúrgica y Geográfica, y es un referente nacional en la "
            "formación de ingenieros del sector minero y energético."
        ),
    ),
    Document(
        id="doc-fqiq",
        title="Facultad de Química e Ingeniería Química (FQIQ)",
        place_id="fqiq",
        text=(
            "La Facultad de Química e Ingeniería Química (FQIQ), fundada en "
            "1855, ofrece las carreras de Química, Ingeniería Química e "
            "Ingeniería Textil, con laboratorios especializados."
        ),
    ),
    Document(
        id="doc-fii",
        title="Facultad de Ingeniería Industrial (FII)",
        place_id="fii",
        text=(
            "La Facultad de Ingeniería Industrial (FII) ofrece la carrera de "
            "Ingeniería Industrial, está acreditada internacionalmente y su "
            "cafetería es famosa por sus sándwiches y café."
        ),
    ),
    Document(
        id="doc-psicologia",
        title="Facultad de Psicología",
        place_id="psicologia",
        text=(
            "La Facultad de Psicología ofrece las carreras de Psicología y "
            "Psicología Organizacional y de la Gestión Humana. Cuenta con "
            "laboratorios modernos, biblioteca especializada y un centro "
            "psicológico que atiende a la comunidad universitaria."
        ),
    ),
    Document(
        id="doc-odontologia",
        title="Facultad de Odontología",
        place_id="odontologia",
        text=(
            "La Facultad de Odontología atiende de lunes a sábado de 8:00 a "
            "22:00 y cuenta con una clínica odontológica propia (lunes a "
            "viernes de 9:00 a 18:00) donde los estudiantes realizan prácticas "
            "supervisadas, con atenciones a precios accesibles para la "
            "comunidad y el público general."
        ),
    ),
    Document(
        id="doc-educacion",
        title="Facultad de Educación",
        place_id="educacion",
        text=(
            "La Facultad de Educación forma docentes y pedagogos con carreras "
            "de Educación Inicial, Primaria y Secundaria por especialidades, y "
            "Educación Física. Cuenta con laboratorios de enseñanza y sala de "
            "cómputo."
        ),
    ),
    Document(
        id="doc-letras",
        title="Facultad de Letras y Ciencias Humanas (FLCH)",
        place_id="letras-humanidades",
        text=(
            "La Facultad de Letras y Ciencias Humanas (FLCH) está en el patio "
            "central histórico del campus y ofrece carreras como Literatura, "
            "Lingüística, Filosofía, Historia, Arte, Comunicación Social, "
            "Bibliotecología y Traducción e Interpretación. Es la única del "
            "Perú con Conservación y Restauración y cuenta con tres auditorios, "
            "biblioteca especializada y Centro de Idiomas."
        ),
    ),
    Document(
        id="doc-ciencias-sociales",
        title="Facultad de Ciencias Sociales (FCCSS)",
        place_id="ciencias-sociales",
        text=(
            "La Facultad de Ciencias Sociales (FCCSS) ofrece carreras de "
            "Sociología, Antropología, Trabajo Social, Arqueología, Ciencia "
            "Política y Geografía. Tiene un patio interior de uso libre y está "
            "muy cerca del Estadio Olímpico."
        ),
    ),
    Document(
        id="doc-ciencias-biologicas",
        title="Facultad de Ciencias Biológicas",
        place_id="ciencias-biologicas",
        text=(
            "La Facultad de Ciencias Biológicas ofrece las carreras de "
            "Biología, Microbiología y Parasitología, y Genética y "
            "Biotecnología. Es el principal centro de investigación biológica "
            "del Perú y sus laboratorios identifican nuevas especies cada año."
        ),
    ),
    Document(
        id="doc-ciencias-fisicas",
        title="Facultad de Ciencias Físicas (FCF)",
        place_id="ciencias-fisicas",
        text=(
            "La Facultad de Ciencias Físicas (FCF) ofrece las carreras de "
            "Física y Física Médica, con investigación en astrofísica, óptica "
            "y física aplicada."
        ),
    ),
    Document(
        id="doc-ciencias-matematicas",
        title="Facultad de Ciencias Matemáticas (FCM)",
        place_id="ciencias-matematicas",
        text=(
            "La Facultad de Ciencias Matemáticas (FCM), en la Av. Venezuela "
            "3400, ofrece las carreras de Matemática, Estadística, "
            "Investigación Operativa y Computación Científica. Inició funciones "
            "en 1850."
        ),
    ),
    Document(
        id="doc-ciencias-administrativas",
        title="Facultad de Ciencias Administrativas (FCA)",
        place_id="ciencias-administrativas",
        text=(
            "La Facultad de Ciencias Administrativas (FCA) ofrece las carreras "
            "de Administración, Administración de Turismo y Administración de "
            "Negocios Internacionales, y forma administradores con proyección "
            "internacional."
        ),
    ),
    Document(
        id="doc-ciencias-contables",
        title="Facultad de Ciencias Contables (FCC)",
        place_id="ciencias-contables",
        text=(
            "La Facultad de Ciencias Contables (FCC) forma contadores públicos "
            "y auditores, con orientación a las finanzas, la auditoría y la "
            "tributación."
        ),
    ),
    Document(
        id="doc-ciencias-economicas",
        title="Facultad de Ciencias Económicas (FCE)",
        place_id="ciencias-economicas",
        text=(
            "La Facultad de Ciencias Económicas (FCE) está en un pabellón nuevo "
            "de la Av. Amézaga 375 y ofrece la carrera de Economía, formando "
            "economistas con una sólida base teórica y cuantitativa."
        ),
    ),
    Document(
        id="doc-derecho",
        title="Facultad de Derecho y Ciencia Política (FDCP)",
        place_id="derecho",
        text=(
            "La Facultad de Derecho y Ciencia Política (FDCP) ofrece la carrera "
            "de Derecho y Ciencia Política y es una de las más antiguas de la "
            "UNMSM, con antecedentes desde 1551. Tiene dos edificios, uno para "
            "Derecho y otro para Ciencia Política."
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
