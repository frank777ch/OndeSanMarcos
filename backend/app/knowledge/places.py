"""Lugares del campus de la UNMSM.

Espejo en el backend del dataset del frontend
(`src/features/map/constants/unmsm.ts` → `CAMPUS_PLACES`). Mantener ambos
alineados: el frontend usa estos `id` para centrar el mapa ("Ver en mapa").

Fuente: `frontend/src/features/map/constants/unmsm.ts` (`CAMPUS_PLACES`). Los
textos descriptivos asociados viven en el corpus (`app/knowledge/corpus.py`),
derivado de `app/knowledge/sources/unmsm_info.md`.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class Coordinate:
    """Coordenada geográfica."""

    latitude: float
    longitude: float


@dataclass(frozen=True)
class CampusPlace:
    """Lugar del campus con metadatos para búsqueda y mapa."""

    id: str
    name: str
    schedule: str
    keywords: tuple[str, ...]
    coordinate: Coordinate


CAMPUS_PLACES: list[CampusPlace] = [
    # =============== ADMINISTRACIÓN ===============
    CampusPlace(
        id="rectorado",
        name="Rectorado (Edificio Jorge Basadre)",
        schedule="Lun–Vie 8:00–16:00",
        keywords=(
            "rectorado", "rector", "administracion central",
            "jorge basadre", "autoridades", "gobierno universitario",
        ),
        coordinate=Coordinate(-12.0566, -77.0862),
    ),
    CampusPlace(
        id="oca",
        name="Oficina Central de Admisión (OCA)",
        schedule="Lun–Vie 9:00–16:00",
        keywords=(
            "oca", "oficina central de admision", "admision",
            "postulante", "examen de admision", "inscripcion",
        ),
        coordinate=Coordinate(-12.051715, -77.085066),
    ),
    # =============== SERVICIOS DE SALUD ===============
    CampusPlace(
        id="clinica-universitaria",
        name="Clínica Universitaria UNMSM",
        schedule="Lun–Sáb 8:00–20:00",
        keywords=(
            "clinica", "clinica universitaria", "medico", "salud",
            "consulta", "traumatologia", "dermatologia", "cardiologia",
            "laboratorio", "rayos x", "emergencia", "doctor",
        ),
        coordinate=Coordinate(-12.0572, -77.0848),
    ),
    CampusPlace(
        id="clinica-odontologia",
        name="Clínica de Odontología UNMSM",
        schedule="Lun–Vie 9:00–18:00 · Tel: 619-7000",
        keywords=(
            "odontologia", "dentista", "dientes", "dental",
            "clinica odontologica", "ortodoncia", "endodoncia",
        ),
        coordinate=Coordinate(-12.0541, -77.0858),
    ),
    # =============== ALIMENTACIÓN ===============
    CampusPlace(
        id="comedor-universitario",
        name="Comedor Universitario",
        schedule=(
            "Lun–Vie · Desayuno: 7:00 (Sin Ticket) · "
            "Almuerzo: 12:00–13:40 (Con Ticket) · Cena: 17:00–18:00 (Con Ticket)"
        ),
        keywords=(
            "comedor", "comedor universitario", "almuerzo", "desayuno",
            "cena", "comer", "ticket", "racion", "comida",
        ),
        coordinate=Coordinate(-12.059308, -77.083110),
    ),
    # =============== CAFETERÍAS ===============
    CampusPlace(
        id="cafeteria-fqiq",
        name="Cafetería de la Facultad de Química e Ingeniería Química",
        schedule="Lun–Sáb 9:00–20:00",
        keywords=(
            "cafeteria", "ingenieria quimica", "fqiq",
            "comida", "almuerzo", "bebidas", "snacks",
        ),
        coordinate=Coordinate(-12.060086195434918, -77.0836630021812),
    ),
    CampusPlace(
        id="cafeteria-civil",
        name="Cafetería de la Facultad de Ingeniería Civil",
        schedule="Lun–Sáb 9:00–20:00",
        keywords=(
            "cafeteria", "ingenieria civil", "civil",
            "comida", "bebidas", "snacks",
        ),
        coordinate=Coordinate(-12.056188014687539, -77.08728273437961),
    ),
    CampusPlace(
        id="cafeteria-odontologia",
        name="Cafetería de la Facultad de Odontología",
        schedule="Lun–Sáb 9:00–20:00",
        keywords=(
            "cafeteria", "odontologia",
            "comida", "bebidas", "snacks", "almuerzo",
        ),
        coordinate=Coordinate(-12.054604510658335, -77.08521348497445),
    ),
    CampusPlace(
        id="cafeteria-clinica-universitaria",
        name="Cafetería de la Clínica Universitaria",
        schedule="Lun–Sáb 9:00–20:00",
        keywords=(
            "cafeteria", "clinica universitaria", "clinica",
            "comida", "bebidas", "snacks", "almuerzo",
        ),
        coordinate=Coordinate(-12.056054089219492, -77.08180958265828),
    ),
    CampusPlace(
        id="cafeteria-industrial",
        name="Cafetería de la Facultad de Ingeniería Industrial",
        schedule="Lun–Sáb 9:00–20:00",
        keywords=(
            "cafeteria", "ingenieria industrial", "industrial", "fii",
            "comida", "bebidas", "snacks", "almuerzo",
        ),
        coordinate=Coordinate(-12.059924310092116, -77.08004651645386),
    ),
    # =============== BIBLIOTECA ===============
    CampusPlace(
        id="biblioteca-central",
        name="Biblioteca Central Pedro Zulen",
        schedule=(
            "Lun–Sáb 8:00–20:00 · Requiere carné de biblioteca · "
            "Tel: 619-7000 anexo 7701"
        ),
        keywords=(
            "biblioteca", "biblioteca central", "pedro zulen",
            "libros", "tesis", "hemeroteca", "sisbib", "leer", "estudiar",
        ),
        coordinate=Coordinate(-12.055728, -77.085234),
    ),
    # =============== RESIDENCIA ===============
    CampusPlace(
        id="residencia-universitaria",
        name="Residencia Universitaria",
        schedule="Atención administrativa: Lun–Vie 8:00–16:00",
        keywords=(
            "residencia", "vivienda universitaria", "hospedaje",
            "alojamiento", "beca vivienda",
        ),
        coordinate=Coordinate(-12.054826, -77.084203),
    ),
    # =============== DEPORTES ===============
    CampusPlace(
        id="estadio-universitario",
        name="Estadio Olímpico de San Marcos",
        schedule="Acceso sujeto a eventos y actividades programadas",
        keywords=(
            "estadio", "pista atletica",
            "cancha", "atletismo", "concierto", "evento",
        ),
        coordinate=Coordinate(-12.057048, -77.081738),
    ),
    CampusPlace(
        id="gimnasio-universitario",
        name="Gimnasio Universitario",
        schedule="Lun–Vie 6:00–20:00 · Sáb 8:00–16:30",
        keywords=(
            "gimnasio", "gym", "pesas", "ejercicio",
            "deporte", "entrenamiento", "fitness",
        ),
        coordinate=Coordinate(-12.0601, -77.0843),
    ),
    # =============== AUDITORIOS ===============
    CampusPlace(
        id="auditorio-ella-dunbar-temple",
        name="Auditorio Ella Dunbar Temple - UNMSM",
        schedule="Según programación de eventos",
        keywords=(
            "auditorio", "ella dunbar", "dunbar temple",
            "eventos", "conferencia", "graduacion", "promociones",
        ),
        coordinate=Coordinate(-12.056592, -77.085550),
    ),
    CampusPlace(
        id="auditorio-rosa-alarco",
        name="Auditorio Rosa Alarco Larraburre",
        schedule="Según programación de eventos",
        keywords=(
            "auditorio", "rosa alarco", "larraburre",
            "eventos", "conferencia", "charla",
        ),
        coordinate=Coordinate(-12.055686, -77.084437),
    ),
    # =============== FACULTADES ===============
    CampusPlace(
        id="fisi",
        name="Facultad de Ingeniería de Sistemas e Informática (FISI)",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "fisi", "sistemas", "ingenieria de sistemas",
            "ingenieria de software", "informatica",
            "software", "programacion", "computacion",
        ),
        coordinate=Coordinate(-12.053317, -77.085456),
    ),
    CampusPlace(
        id="fic",
        name="Facultad de Ingeniería Civil",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "ingenieria civil", "fic", "civil",
            "construccion", "estructuras",
        ),
        coordinate=Coordinate(-12.055903, -77.086861),
    ),
    CampusPlace(
        id="fiee",
        name="Facultad de Ingeniería Electrónica y Eléctrica",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "electronica", "electrica", "biomedica", "fiee",
            "ingenieria electronica", "telecomunicaciones",
        ),
        coordinate=Coordinate(-12.056093, -77.080914),
    ),
    CampusPlace(
        id="figmmg",
        name="Facultad de Ingeniería Geológica, Minera y Metalúrgica",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "geologia", "mineria", "metalurgia", "figmmg",
            "minas", "geologica", "minera",
        ),
        coordinate=Coordinate(-12.060661, -77.084518),
    ),
    CampusPlace(
        id="fqiq",
        name="Facultad de Química e Ingeniería Química",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=("quimica", "textil", "ingenieria quimica", "fqiq"),
        coordinate=Coordinate(-12.060362, -77.083661),
    ),
    CampusPlace(
        id="fii",
        name="Facultad de Ingeniería Industrial",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "industrial", "ingenieria industrial", "fii",
            "produccion", "gestion",
        ),
        coordinate=Coordinate(-12.059723, -77.080195),
    ),
    CampusPlace(
        id="psicologia",
        name="Facultad de Psicología",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "psicologia", "psicologo", "facultad de psicologia",
            "conducta", "mente",
        ),
        coordinate=Coordinate(-12.053410, -77.086725),
    ),
    CampusPlace(
        id="odontologia",
        name="Facultad de Odontología",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "odontologia", "dentista", "dientes", "estomatologia",
            "facultad de odontologia",
        ),
        coordinate=Coordinate(-12.054037, -77.085411),
    ),
    CampusPlace(
        id="educacion",
        name="Facultad de Educación",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "educacion", "pedagogia", "docente", "ensenanza",
            "facultad de educacion",
        ),
        coordinate=Coordinate(-12.054696, -77.084633),
    ),
    CampusPlace(
        id="letras-humanidades",
        name="Facultad de Letras y Ciencias Humanas",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "letras", "humanidades", "literatura", "linguistica",
            "filosofia", "historia", "facultad de letras",
        ),
        coordinate=Coordinate(-12.057106, -77.081417),
    ),
    CampusPlace(
        id="ciencias-sociales",
        name="Facultad de Ciencias Sociales",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "ciencias sociales", "sociologia", "antropologia",
            "trabajo social", "arqueologia",
        ),
        coordinate=Coordinate(-12.057896, -77.081176),
    ),
    CampusPlace(
        id="ciencias-biologicas",
        name="Facultad de Ciencias Biológicas",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "biologia", "biologicas", "ciencias biologicas",
            "microbiologia", "genetica", "ecologia",
        ),
        coordinate=Coordinate(-12.0594, -77.0820),
    ),
    CampusPlace(
        id="ciencias-fisicas",
        name="Facultad de Ciencias Físicas",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "fisica", "ciencias fisicas", "fisico",
            "astrofisica", "optica",
        ),
        coordinate=Coordinate(-12.059594, -77.081883),
    ),
    CampusPlace(
        id="ciencias-matematicas",
        name="Facultad de Ciencias Matemáticas",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "matematicas", "matematica", "estadistica",
            "computacion cientifica", "investigacion operativa",
        ),
        coordinate=Coordinate(-12.060165, -77.081778),
    ),
    CampusPlace(
        id="ciencias-administrativas",
        name="Facultad de Ciencias Administrativas",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "administracion", "administrativas", "turismo",
            "hoteleria", "gestion empresarial",
        ),
        coordinate=Coordinate(-12.057420, -77.081001),
    ),
    CampusPlace(
        id="ciencias-contables",
        name="Facultad de Ciencias Contables",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "contabilidad", "contables", "auditoria",
            "finanzas", "tributacion",
        ),
        coordinate=Coordinate(-12.057643, -77.079975),
    ),
    CampusPlace(
        id="ciencias-economicas",
        name="Facultad de Ciencias Económicas",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "economia", "economicas", "economista",
            "macroeconomia", "microeconomia",
        ),
        coordinate=Coordinate(-12.052943, -77.085795),
    ),
    CampusPlace(
        id="derecho",
        name="Facultad de Derecho y Ciencia Política",
        schedule="Lun–Sáb 8:00–22:00",
        keywords=(
            "derecho", "ciencia politica", "abogado", "leyes",
            "facultad de derecho", "fdcp", "juridica", "jurisprudencia",
        ),
        coordinate=Coordinate(-12.058368, -77.080267),
    ),
    # =============== OTROS LUGARES DEL CAMPUS ===============
    CampusPlace(
        id="cepreunmsm",
        name="Centro Preuniversitario UNMSM (CEPREUNMSM)",
        schedule="Según ciclo académico vigente · Consultar en cepre.unmsm.edu.pe",
        keywords=(
            "cepreunmsm", "cepre", "preuniversitario", "pre",
            "preparatoria", "academia", "postulante", "admision",
        ),
        coordinate=Coordinate(-12.052018, -77.085390),
    ),
    CampusPlace(
        id="huaca-san-marcos",
        name="Huaca San Marcos",
        schedule="Acceso libre dentro del campus",
        keywords=(
            "huaca", "huaca san marcos", "arqueologia", "cultura maranga",
            "monumento arqueologico", "patrimonio", "historia",
        ),
        coordinate=Coordinate(-12.059995, -77.086027),
    ),
    CampusPlace(
        id="posgrado",
        name="Escuela de Posgrado UNMSM",
        schedule="Lun–Vie 8:00–20:00",
        keywords=(
            "posgrado", "maestria", "doctorado", "escuela de posgrado",
            "segunda especialidad", "dgep",
        ),
        coordinate=Coordinate(-12.052401, -77.085791),
    ),
]

_PLACES_BY_ID: dict[str, CampusPlace] = {place.id: place for place in CAMPUS_PLACES}


def normalize(text: str) -> str:
    """Minúsculas y sin tildes, para emparejar consultas de forma robusta."""
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def get_place_by_id(place_id: str) -> CampusPlace | None:
    """Devuelve el lugar con ese id, o None si no existe."""
    return _PLACES_BY_ID.get(place_id)


def find_places(query: str) -> list[CampusPlace]:
    """Lugares cuyas palabras clave aparecen en la consulta (sin tildes)."""
    normalized_query = normalize(query)
    return [
        place
        for place in CAMPUS_PLACES
        if any(normalize(keyword) in normalized_query for keyword in place.keywords)
    ]
