import type { LngLat } from '../constants/campus'

export type PlaceCategoryId =
  | 'facultades'
  | 'cafeterias'
  | 'auditorios'
  | 'campos-deportivos'
  | 'puertas'
  | 'administracion'
  | 'salud'
  | 'servicios'
  | 'otros'

export interface PlaceCategory {
  id: PlaceCategoryId
  label: string
  /** Color del punto en el mapa. */
  color: string
}

export interface Place {
  id: string
  name: string
  category: PlaceCategoryId
  /** [lng, lat] */
  coordinates: LngLat
  /** Palabras o siglas con las que también se puede buscar el lugar. */
  keywords: string[]
}

/** Categorías en el orden en que se muestran los filtros. */
export const PLACE_CATEGORIES: PlaceCategory[] = [
  { id: 'facultades', label: 'Facultades', color: '#3056ac' },
  { id: 'cafeterias', label: 'Cafeterías', color: '#ff8f10' },
  { id: 'auditorios', label: 'Auditorios', color: '#8e44ad' },
  { id: 'campos-deportivos', label: 'Campos deportivos', color: '#2e9e57' },
  { id: 'puertas', label: 'Puertas', color: '#e74c3c' },
  { id: 'administracion', label: 'Administración', color: '#00838f' },
  { id: 'salud', label: 'Salud', color: '#d81b60' },
  { id: 'servicios', label: 'Servicios', color: '#6d4c41' },
  { id: 'otros', label: 'Otros', color: '#757575' },
]

/**
 * Lugares del campus. Unifica los puntos del mapa (ids "1"–"40") con los
 * lugares del asistente que no tenían punto (ids con nombre). Coordenadas
 * aproximadas.
 * Pendiente de limpieza: los ids "23" y "25" repiten el nombre.
 */
export const PLACES: Place[] = [
  {
    id: "1",
    name: "Puerta 8",
    category: 'puertas',
    coordinates: [-77.08761951511643, -12.051880164062666],
    keywords: [],
  },
  {
    id: "2",
    name: "Puerta 7",
    category: 'puertas',
    coordinates: [-77.08454506116111, -12.053801766665373],
    keywords: [],
  },
  {
    id: "3",
    name: "Puerta 3",
    category: 'puertas',
    coordinates: [-77.08001732406147, -12.057136012331654],
    keywords: [],
  },
  {
    id: "4",
    name: "Puerta 2",
    category: 'puertas',
    coordinates: [-77.07936395135454, -12.059496369475596],
    keywords: [],
  },
  {
    id: "5",
    name: "Puerta 1",
    category: 'puertas',
    coordinates: [-77.08583596979169, -12.060949126150703],
    keywords: [],
  },
  {
    id: "6",
    name: "Puerta 6",
    category: 'puertas',
    coordinates: [-77.0837569, -12.0544354],
    keywords: [],
  },
  {
    id: "7",
    name: "Puerta 5",
    category: 'puertas',
    coordinates: [-77.0824707, -12.0551539],
    keywords: [],
  },
  {
    id: "8",
    name: "Facultad de Ingeniería de Sistemas e Informática (FISI)",
    category: 'facultades',
    coordinates: [-77.0857217, -12.0535548],
    keywords: ["fisi", "sistemas", "ingenieria de sistemas", "ingenieria de software", "informatica", "software", "programacion", "computacion"],
  },
  {
    id: "9",
    name: "Escuela Profesional de Enfermería y Tecnología Médica",
    category: 'facultades',
    coordinates: [-77.08731436531114, -12.053249259683904],
    keywords: [],
  },
  {
    id: "10",
    name: "Facultad de Psicología",
    category: 'facultades',
    coordinates: [-77.0867638, -12.0535766],
    keywords: ["psicologia", "psicologo", "facultad de psicologia", "conducta", "mente"],
  },
  {
    id: "11",
    name: "Facultad de Ingeniería Electrónica y Eléctrica",
    category: 'facultades',
    coordinates: [-77.0869915, -12.0552369],
    keywords: ["electronica", "electrica", "biomedica", "fiee", "ingenieria electronica", "telecomunicaciones"],
  },
  {
    id: "12",
    name: "Facultad de Ingeniería Civil",
    category: 'facultades',
    coordinates: [-77.087094, -12.0558976],
    keywords: ["ingenieria civil", "fic", "civil", "construccion", "estructuras"],
  },
  {
    id: "13",
    name: "Escuela Profesional de Ing. de Mecanica de Fluidos",
    category: 'facultades',
    coordinates: [-77.087094, -12.0558976],
    keywords: [],
  },
  {
    id: "14",
    name: "Escuela Profesional de Ingeniería Geografica",
    category: 'facultades',
    coordinates: [-77.0860475, -12.0555738],
    keywords: [],
  },
  {
    id: "15",
    name: "Facultad de Educación",
    category: 'facultades',
    coordinates: [-77.0851319, -12.0554579],
    keywords: ["educacion", "pedagogia", "docente", "ensenanza", "facultad de educacion"],
  },
  {
    id: "16",
    name: "Facultad de Educación Física",
    category: 'facultades',
    coordinates: [-77.084732, -12.054717],
    keywords: [],
  },
  {
    id: "17",
    name: "Facultad de Ingeniería Geológica, Minera y Metalúrgica",
    category: 'facultades',
    coordinates: [-77.084739, -12.0607884],
    keywords: ["geologia", "mineria", "metalurgia", "figmmg", "minas", "geologica", "minera"],
  },
  {
    id: "18",
    name: "Facultad de Ingeniería Geológica",
    category: 'facultades',
    coordinates: [-77.084194, -12.06022],
    keywords: [],
  },
  {
    id: "19",
    name: "Facultad de Química e Ingeniería Química",
    category: 'facultades',
    coordinates: [-77.0835806, -12.060074],
    keywords: ["quimica", "textil", "ingenieria quimica", "fqiq"],
  },
  {
    id: "20",
    name: "Facultad de Ciencias Biológicas",
    category: 'facultades',
    coordinates: [-77.08205978986605, -12.0596728770671],
    keywords: ["biologia", "biologicas", "ciencias biologicas", "microbiologia", "genetica", "ecologia"],
  },
  {
    id: "21",
    name: "Facultad de Ciencias Físicas",
    category: 'facultades',
    coordinates: [-77.0818206, -12.0595585],
    keywords: ["fisica", "ciencias fisicas", "fisico", "astrofisica", "optica"],
  },
  {
    id: "22",
    name: "Facultad de Ciencias Matemáticas",
    category: 'facultades',
    coordinates: [-77.0823088, -12.0605261],
    keywords: ["matematicas", "matematica", "estadistica", "computacion cientifica", "investigacion operativa"],
  },
  {
    id: "23",
    name: "Facultad de Ingeniería Industrial",
    category: 'facultades',
    coordinates: [-77.0809839, -12.0600774],
    keywords: [],
  },
  {
    id: "24",
    name: "Facultad de Ciencias Administrativas",
    category: 'facultades',
    coordinates: [-77.0813687, -12.0577069],
    keywords: ["administracion", "administrativas", "turismo", "hoteleria", "gestion empresarial"],
  },
  {
    id: "25",
    name: "Facultad de Ingeniería Industrial",
    category: 'facultades',
    coordinates: [-77.0804662, -12.0596003],
    keywords: ["industrial", "ingenieria industrial", "fii", "produccion", "gestion"],
  },
  {
    id: "26",
    name: "Facultad de Ciencias Sociales",
    category: 'facultades',
    coordinates: [-77.0816666, -12.0579798],
    keywords: ["ciencias sociales", "sociologia", "antropologia", "trabajo social", "arqueologia"],
  },
  {
    id: "27",
    name: "Facultad de Ciencias Economicas (Antiguo)",
    category: 'facultades',
    coordinates: [-77.0811987, -12.0580466],
    keywords: ["economia", "economicas", "economista", "macroeconomia", "microeconomia"],
  },
  {
    id: "28",
    name: "Facultad de Ciencias Contables",
    category: 'facultades',
    coordinates: [-77.0804619, -12.0576735],
    keywords: ["contabilidad", "contables", "auditoria", "finanzas", "tributacion"],
  },
  {
    id: "29",
    name: "Facultad de Letras y Ciencias Humanas",
    category: 'facultades',
    coordinates: [-77.0814113, -12.0574376],
    keywords: ["letras", "humanidades", "literatura", "linguistica", "filosofia", "historia", "facultad de letras"],
  },
  {
    id: "30",
    name: "Facultad de Odontología",
    category: 'facultades',
    coordinates: [-77.08604219318228, -12.054134481058806],
    keywords: ["odontologia", "dentista", "dientes", "estomatologia", "facultad de odontologia"],
  },
  {
    id: "31",
    name: "Facultad de Ciencias Economicas (Nuevo)",
    category: 'facultades',
    coordinates: [-77.086256, -12.0534471],
    keywords: ["economia", "economicas", "economista", "macroeconomia", "microeconomia"],
  },
  {
    id: "32",
    name: "Facultad de Ingeniería de Minas",
    category: 'facultades',
    coordinates: [-77.0876297, -12.052315],
    keywords: [],
  },
  {
    id: "33",
    name: "Cafetería de la Facultad de Química e Ingeniería Química",
    category: 'cafeterias',
    coordinates: [-77.08361038902244, -12.060082360827014],
    keywords: ["cafeteria", "ingenieria quimica", "fqiq", "comida", "almuerzo", "bebidas", "snacks"],
  },
  {
    id: "34",
    name: "Cafetería de la Facultad de Odontología",
    category: 'cafeterias',
    coordinates: [-77.08514887439485, -12.054603716785754],
    keywords: ["cafeteria", "odontologia", "comida", "bebidas", "snacks", "almuerzo"],
  },
  {
    id: "35",
    name: "Cafetería de la Facultad de Ingeniería Civil",
    category: 'cafeterias',
    coordinates: [-77.0872794, -12.0562339],
    keywords: ["cafeteria", "ingenieria civil", "civil", "comida", "bebidas", "snacks"],
  },
  {
    id: "36",
    name: "Puerta 4",
    category: 'puertas',
    coordinates: [-77.0811103, -12.0560269],
    keywords: [],
  },
  {
    id: "37",
    name: "Auditorio Ella Dunbar Temple - UNMSM",
    category: 'auditorios',
    coordinates: [-77.0860517, -12.05667],
    keywords: ["auditorio", "ella dunbar", "dunbar temple", "eventos", "conferencia", "graduacion", "promociones"],
  },
  {
    id: "38",
    name: "Auditorio Rosa Alarco Larraburre",
    category: 'auditorios',
    coordinates: [-77.08521854944695, -12.055838267297563],
    keywords: ["auditorio", "rosa alarco", "larraburre", "eventos", "conferencia", "charla"],
  },
  {
    id: "39",
    name: "Cancha de la Facultad de Ingeniería de Sistemas e Informática",
    category: 'campos-deportivos',
    coordinates: [-77.0852821, -12.0528848],
    keywords: [],
  },
  {
    id: "40",
    name: "Cancha de la Facultad de Ingeniería de Minas",
    category: 'campos-deportivos',
    coordinates: [-77.0869071, -12.0519369],
    keywords: [],
  },
  {
    id: "rectorado",
    name: "Rectorado (Edificio Jorge Basadre)",
    category: 'administracion',
    coordinates: [-77.086252, -12.056524],
    keywords: ["rectorado", "rector", "administracion central", "jorge basadre", "autoridades", "gobierno universitario"],
  },
  {
    id: "oca",
    name: "Oficina Central de Admisión (OCA)",
    category: 'administracion',
    coordinates: [-77.085374, -12.05201],
    keywords: ["oca", "oficina central de admision", "admisión", "admision", "postulante", "examen de admision", "inscripcion"],
  },
  {
    id: "posgrado",
    name: "Escuela de Posgrado UNMSM",
    category: 'administracion',
    coordinates: [-77.085791, -12.052401],
    keywords: ["posgrado", "maestria", "doctorado", "escuela de posgrado", "segunda especialidad", "dgep"],
  },
  {
    id: "cepreunmsm",
    name: "Centro Preuniversitario UNMSM (CEPREUNMSM)",
    category: 'administracion',
    coordinates: [-77.085392, -12.052116],
    keywords: ["cepreunmsm", "cepre", "preuniversitario", "pre", "preparatoria", "academia", "postulante", "admision"],
  },
  {
    id: "clinica-universitaria",
    name: "Clínica Universitaria UNMSM",
    category: 'salud',
    coordinates: [-77.082159, -12.055662],
    keywords: ["clinica", "clinica universitaria", "medico", "salud", "consulta", "traumatologia", "dermatologia", "cardiologia", "laboratorio", "rayos x", "emergencia", "doctor"],
  },
  {
    id: "clinica-odontologia",
    name: "Clínica de Odontología UNMSM",
    category: 'salud',
    coordinates: [-77.085822, -12.054709],
    keywords: ["odontologia", "dentista", "dientes", "dental", "clinica odontologica", "ortodoncia", "endodoncia"],
  },
  {
    id: "comedor-universitario",
    name: "Comedor Universitario",
    category: 'servicios',
    coordinates: [-77.083055, -12.059418],
    keywords: ["comedor", "comedor universitario", "almuerzo", "desayuno", "cena", "comer", "ticket", "racion", "comida"],
  },
  {
    id: "biblioteca-central",
    name: "Biblioteca Central Pedro Zulen",
    category: 'servicios',
    coordinates: [-77.085872, -12.055881],
    keywords: ["biblioteca", "biblioteca central", "pedro zulen", "libros", "tesis", "hemeroteca", "sisbib", "leer", "estudiar"],
  },
  {
    id: "residencia-universitaria",
    name: "Residencia Universitaria",
    category: 'servicios',
    coordinates: [-77.084445, -12.055057],
    keywords: ["residencia", "vivienda universitaria", "hospedaje", "alojamiento", "beca vivienda"],
  },
  {
    id: "huaca-san-marcos",
    name: "Huaca San Marcos",
    category: 'otros',
    coordinates: [-77.086027, -12.059995],
    keywords: ["huaca", "huaca san marcos", "arqueologia", "cultura maranga", "monumento arqueologico", "patrimonio", "historia"],
  },
  {
    id: "cafeteria-clinica-universitaria",
    name: "Cafetería de la Clínica Universitaria",
    category: 'cafeterias',
    coordinates: [-77.08180709585918, -12.055859998919493],
    keywords: ["cafeteria", "clinica universitaria", "clinica", "comida", "bebidas", "snacks", "almuerzo"],
  },
  {
    id: "cafeteria-industrial",
    name: "Cafetería de la Facultad de Ingeniería Industrial",
    category: 'cafeterias',
    coordinates: [-77.0810236227308, -12.060103868074439],
    keywords: ["cafeteria", "ingenieria industrial", "industrial", "fii", "comida", "bebidas", "snacks", "almuerzo"],
  },
  {
    id: "estadio-universitario",
    name: "Estadio Olímpico de San Marcos",
    category: 'campos-deportivos',
    coordinates: [-77.084603, -12.055794],
    keywords: ["estadio", "pista atletica", "cancha", "atletismo", "concierto", "evento"],
  },
  {
    id: "gimnasio-universitario",
    name: "Gimnasio Universitario",
    category: 'campos-deportivos',
    coordinates: [-77.084403, -12.05964],
    keywords: ["gimnasio", "gym", "pesas", "ejercicio", "deporte", "entrenamiento", "fitness"],
  },
  {
    id: "derecho",
    name: "Facultad de Derecho y Ciencia Política",
    category: 'facultades',
    coordinates: [-77.080267, -12.058368],
    keywords: ["derecho", "ciencia politica", "abogado", "leyes", "facultad de derecho", "fdcp", "juridica", "jurisprudencia"],
  },
]
