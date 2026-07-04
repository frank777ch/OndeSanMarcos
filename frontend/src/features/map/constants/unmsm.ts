export const UNMSM = {
  center: {
    latitude: -12.0565,
    longitude: -77.0827,
  },
  bounds: {
    ne: { latitude: -12.049, longitude: -77.075 },
    sw: { latitude: -12.064, longitude: -77.09 },
  },
  camera: {
    zoomLevel: 16,
    pitch: 60, // Aumentado a 60 para mejor efecto 3D
    heading: 0,
  },
} as const;

/** Coordenada geográfica de un lugar del campus. */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/** Lugar del campus de la UNMSM. */
export interface CampusPlace {
  id: string;
  name: string;
  schedule: string;
  /** Palabras clave para emparejar consultas del chat (sin distinguir tildes). */
  keywords: string[];
  coordinate: Coordinate;
  description?: string;
  phone?: string;
  annex?: string;
  careers?: string[];
  usage?: string;
  services?: string[];
  detailedSchedule?: string[];
}

/**
 * Lugares del campus.
 * Las coordenadas son aproximadas (datos de demo) y están dentro de los
 * `bounds` de la UNMSM. Sirven tanto al mapa como al mock del asistente.
 */
export const CAMPUS_PLACES: CampusPlace[] = [
  // =============== ADMINISTRACIÓN ===============
  {
    id: "rectorado",
    name: "Rectorado (Edificio Jorge Basadre)",
    schedule: "Lun–Vie 8:00–16:00",
    keywords: [
      "rectorado",
      "rector",
      "administracion central",
      "jorge basadre",
      "autoridades",
      "gobierno universitario",
    ],
    coordinate: { latitude: -12.0565939, longitude: -77.0862007 },
  },
  {
    id: "oca",
    name: "Oficina Central de Admisión (OCA)",
    schedule: "Lun–Vie 9:00–16:00",
    keywords: [
      "oca",
      "oficina central de admision",
      "admisión",
      "admision",
      "postulante",
      "examen de admision",
      "inscripcion",
    ],
    description:
      "Gestiona todos los procesos de admisión de la UNMSM: examen ordinario, traslado interno y externo, ingreso directo por egresados, PIR (víctimas de terrorismo) y otros. La UNMSM realiza dos exámenes de admisión al año aprox. Uno en marzo y otro en septiembre.",
    coordinate: { latitude: -12.0518114, longitude: -77.0855421 },
  },
  // =============== SERVICIOS DE SALUD ===============
  {
    id: "clinica-universitaria",
    name: "Clínica Universitaria UNMSM",
    schedule: "Lun–Sáb 8:00–20:00",
    keywords: [
      "clinica",
      "clinica universitaria",
      "medico",
      "salud",
      "consulta",
      "traumatologia",
      "dermatologia",
      "cardiologia",
      "laboratorio",
      "rayos x",
      "emergencia",
      "doctor",
    ],
    description:
      "Ofrece servicios de Medicina General, Oftalmología, Ginecología, Psiquiatría, Dermatología, Psicología, Odontología, Nutrición, Traumatología, Radiología, Cardiología, entre otros. Atiende a estudiantes, docentes, personal administrativo, jubilados y comunidad vecina.",
    phone: "956 285 709 / 992 455 977",

    coordinate: { latitude: -12.055662, longitude: -77.082159 },
  },
  {
    id: "clinica-odontologia",
    name: "Clínica de Odontología UNMSM",
    schedule: "Lun–Vie 9:00–18:00",
    keywords: [
      "odontologia",
      "dentista",
      "dientes",
      "dental",
      "clinica odontologica",
      "ortodoncia",
      "endodoncia",
    ],
    description:
      "Forma odontólogos y cuenta con clínica propia donde los estudiantes realizan prácticas supervisadas. Ofrece atenciones a precios accesibles para la comunidad universitaria y público general.",
    phone: "619-7000",
    annex: "3408",

    coordinate: {
      latitude: -12.054703855361273,
      longitude: -77.08581871985677,
    },
  },
  // =============== ALIMENTACIÓN ===============
  {
    id: "comedor-universitario",
    name: "Comedor Universitario",
    schedule: "Lun–Vie 7:00–18:00",
    detailedSchedule: [
      "Desayuno: 7:00 (Sin Ticket)",
      "Almuerzo: 12:00–13:40 (Con Ticket)",
      "Cena: 17:00–18:00 (Con Ticket)",
    ],
    keywords: [
      "comedor",
      "comedor universitario",
      "almuerzo",
      "desayuno",
      "cena",
      "comer",
      "ticket",
      "racion",
      "comida",
    ],
    description:
      'Capacidad para hasta 2,600 estudiantes por turno de almuerzo. Declarado "Comedor Universitario Saludable" por el MINSA en 2019. Gratuito para estudiantes de pregrado matriculados.',

    coordinate: {
      latitude: -12.059441294706257,
      longitude: -77.08302968537159,
    },
  },
  // ============== CAFETERÍAS ===============
  {
    id: "cafeteria-fqiq",
    name: "Cafetería de la Facultad de Química e Ingeniería Química",
    schedule: "Lun–Sáb 9:00–20:00",
    keywords: [
      "cafeteria",
      "ingenieria quimica",
      "fqiq",
      "comida",
      "almuerzo",
      "bebidas",
      "snacks",
    ],
    description:
      "Cafetería principal de la Facultad de Química e Ingeniería Química.",
    services: ["Venta de alimentos", "Snacks", "Bebidas", "Postres"],

    coordinate: { latitude: -12.060086195434918, longitude: -77.0836630021812 },
  },
  {
    id: "cafeteria-civil",
    name: "Cafetería de la Facultad de Ingeniería Civil",
    schedule: "Lun–Sáb 9:00–20:00",
    keywords: [
      "cafeteria",
      "ingenieria civil",
      "civil",
      "comida",
      "bebidas",
      "snacks",
    ],
    description: "Cafetería principal de la Facultad de Ingeniería Civil.",
    services: ["Venta de alimentos", "Snacks", "Bebidas"],

    coordinate: {
      latitude: -12.056188014687539,
      longitude: -77.08728273437961,
    },
  },

  {
    id: "cafeteria-odontologia",
    name: "Cafetería de la Facultad de Odontología",
    schedule: "Lun–Sáb 9:00–20:00",
    keywords: [
      "cafeteria",
      "odontologia",
      "comida",
      "bebidas",
      "snacks",
      "almuerzo",
    ],
    description: "Cafetería principal de la Facultad de Odontología.",
    services: ["Venta de alimentos", "Snacks", "Bebidas"],

    coordinate: {
      latitude: -12.054604510658335,
      longitude: -77.08521348497445,
    },
  },

  {
    id: "cafeteria-clinica-universitaria",
    name: "Cafetería de la Clínica Universitaria",
    schedule: "Lun–Sáb 9:00–20:00",
    keywords: [
      "cafeteria",
      "clinica universitaria",
      "clinica",
      "comida",
      "bebidas",
      "snacks",
      "almuerzo",
    ],
    description: "Cafetería ubicada en la Clínica Universitaria UNMSM.",
    services: ["Venta de almuerzos", "Postres", "Jugos"],

    coordinate: {
      latitude: -12.056054089219492,
      longitude: -77.08180958265828,
    },
  },
  {
    id: "cafeteria-industrial",
    name: "Cafetería de la Facultad de Ingeniería Industrial",
    schedule: "Lun–Sáb 9:00–20:00",
    keywords: [
      "cafeteria",
      "ingenieria industrial",
      "industrial",
      "fii",
      "comida",
      "bebidas",
      "snacks",
      "almuerzo",
    ],
    description:
      "Cafetería famosa por sus sándwiches y café. Cuenta con vending machines en el lobby.",
    services: ["Venta de alimentos", "Snacks", "Bebidas"],

    coordinate: {
      latitude: -12.059924310092116,
      longitude: -77.08004651645386,
    },
  },
  // =============== BIBLIOTECA ===============
  {
    id: "biblioteca-central",
    name: "Biblioteca Central Pedro Zulen",
    schedule: "Lun–Sáb 8:00–20:00",
    detailedSchedule: ["Requiere carné de biblioteca"],
    keywords: [
      "biblioteca",
      "biblioteca central",
      "pedro zulen",
      "libros",
      "tesis",
      "hemeroteca",
      "sisbib",
      "leer",
      "estudiar",
    ],
    description:
      "La biblioteca universitaria más grande del Perú (19,800 m²). Capacidad para 2,500 usuarios simultáneos. Ofrece préstamo de libros, sala de tesis, hemeroteca y sistema Cybertesis.",
    phone: "619-7000",
    annex: "7701",

    coordinate: { latitude: -12.055728, longitude: -77.085234 },
  },
  // =============== RESIDENCIA ===============
  {
    id: "residencia-universitaria",
    name: "Residencia Universitaria",
    schedule: "Atención administrativa: Lun–Vie 8:00–16:00",
    keywords: [
      "residencia",
      "vivienda universitaria",
      "hospedaje",
      "alojamiento",
      "beca vivienda",
    ],
    description:
      "Vivienda universitaria para estudiantes de escasos recursos. Incluye biblioteca, sala de cómputo, cocina, sala de visitas, auditorio y lavandería.",
    phone: "619-7000",
    annex: "7526",

    coordinate: { latitude: -12.054826, longitude: -77.084203 },
  },
  // =============== DEPORTES ===============
  {
    id: "estadio-universitario",
    name: "Estadio Olímpico de San Marcos",
    schedule: "Acceso sujeto a eventos y actividades programadas",
    keywords: [
      "estadio",
      "pista atletica",
      "cancha",
      "atletismo",
      "concierto",
      "evento",
    ],
    description:
      "Cuenta con pista atlética y campo de fútbol. Se utiliza para eventos deportivos universitarios y grandes conciertos internacionales.",

    coordinate: { latitude: -12.057048, longitude: -77.081738 },
  },
  {
    id: "gimnasio-universitario",
    name: "Gimnasio Universitario",
    schedule: "Lun–Vie 6:00–20:00 · Sáb 8:00–16:30",
    keywords: [
      "gimnasio",
      "gym",
      "pesas",
      "ejercicio",
      "deporte",
      "entrenamiento",
      "fitness",
    ],
    description:
      "Uso gratuito para la comunidad sanmarquina. Ofrece canchas de fútbol, vóley y básquet, zona de pesas y equipos de ejercicio modernos de acceso libre.",

    coordinate: { latitude: -12.0601, longitude: -77.0843 },
  },
  // =============== AUDITORIOS ===============
  {
    id: "auditorio-ella-dunbar-temple",
    name: "Auditorio Ella Dunbar Temple - UNMSM",
    schedule: "Según programación de eventos",
    keywords: [
      "auditorio",
      "ella dunbar",
      "dunbar temple",
      "eventos",
      "conferencia",
      "graduacion",
      "promociones",
    ],
    description:
      "Auditorio con capacidad para aproximadamente 400 butacas. Equipado con sistemas de videoconferencia, proyectores multimedia y sonido profesional.",
    usage:
      "Ceremonias de graduación, conferencias, eventos académicos y culturales de gran escala.",

    coordinate: { latitude: -12.056592, longitude: -77.08555 },
  },
  {
    id: "auditorio-rosa-alarco",
    name: "Auditorio Rosa Alarco Larraburre",
    schedule: "Según programación de eventos",
    keywords: [
      "auditorio",
      "rosa alarco",
      "larraburre",
      "eventos",
      "conferencia",
      "charla",
    ],
    description: "Auditorio utilizado para eventos de escala mediana.",
    usage: "Conferencias, charlas, seminarios y eventos de escala mediana.",

    coordinate: { latitude: -12.055686, longitude: -77.084437 },
  },
  // =============== FACULTADES ===============
  {
    id: "fisi",
    name: "Facultad de Ingeniería de Sistemas e Informática (FISI)",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "fisi",
      "sistemas",
      "ingenieria de sistemas",
      "ingenieria de software",
      "informatica",
      "software",
      "programacion",
      "computacion",
    ],
    description:
      "Una de las mejores facultades de informática del Perú según múltiples rankings. Cuenta con laboratorios de cómputo modernos y grupos de investigación activos.",
    phone: "619-7000",
    careers: ["Ingeniería de Sistemas", "Ingeniería de Software"],

    coordinate: { latitude: -12.053317, longitude: -77.085456 },
  },
  {
    id: "fic",
    name: "Facultad de Ingeniería Civil",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "ingenieria civil",
      "fic",
      "civil",
      "construccion",
      "estructuras",
    ],
    description:
      "Edificio moderno con aulas bien equipadas. Cuenta con laboratorios de estructuras, geotecnia e hidráulica.",
    careers: ["Ingeniería Civil"],

    coordinate: { latitude: -12.055903, longitude: -77.086861 },
  },
  {
    id: "fiee",
    name: "Facultad de Ingeniería Electrónica y Eléctrica",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "electronica",
      "electrica",
      "biomedica",
      "fiee",
      "ingenieria electronica",
      "telecomunicaciones",
    ],
    description:
      "Fundada en 1969. Pabellón nuevo con acceso para personas con discapacidad, sala de estudio y comedor en el tercer piso. Laboratorios de electrónica, telecomunicaciones y biomédica.",
    phone: "619-7000",
    careers: [
      "Ingeniería Electrónica",
      "Ingeniería Eléctrica",
      "Ingeniería de Telecomunicaciones",
      "Ingeniería Biomédica",
    ],

    coordinate: { latitude: -12.056093, longitude: -77.080914 },
  },
  {
    id: "figmmg",
    name: "Facultad de Ingeniería Geológica, Minera y Metalúrgica",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "geologia",
      "mineria",
      "metalurgia",
      "figmmg",
      "minas",
      "geologica",
      "minera",
    ],
    description:
      "Referente nacional en formación de ingenieros del sector minero y energético. Tiene convenios con empresas del sector extractivo.",
    careers: [
      "Ingeniería Geológica",
      "Ingeniería de Minas",
      "Ingeniería Metalúrgica",
      "Ingeniería Geográfica",
    ],

    coordinate: { latitude: -12.060661, longitude: -77.084518 },
  },
  {
    id: "fqiq",
    name: "Facultad de Química e Ingeniería Química",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: ["quimica", "textil", "ingenieria quimica", "fqiq"],
    description:
      "Fundada en 1855. Forma químicos e ingenieros químicos con laboratorios especializados.",
    phone: "619-7000",
    careers: ["Química", "Ingeniería Química", "Ingeniería Textil"],

    coordinate: { latitude: -12.060362, longitude: -77.083661 },
  },
  {
    id: "fii",
    name: "Facultad de Ingeniería Industrial",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "industrial",
      "ingenieria industrial",
      "fii",
      "produccion",
      "gestion",
    ],
    description:
      "Creada en 1988. Acreditada internacionalmente. Excelente nivel académico.",
    phone: "619-7000",
    careers: ["Ingeniería Industrial"],

    coordinate: {
      latitude: -12.060145848568606,
      longitude: -77.08098434943068,
    },
  },
  {
    id: "psicologia",
    name: "Facultad de Psicología",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "psicologia",
      "psicologo",
      "facultad de psicologia",
      "conducta",
      "mente",
    ],
    description:
      "Cuenta con laboratorios modernos, biblioteca especializada y un centro psicológico que brinda atención a la comunidad universitaria.",
    phone: "619-7000",
    careers: ["Psicología", "Psicología Organizacional y de la Gestión Humana"],

    coordinate: { latitude: -12.05341, longitude: -77.086725 },
  },
  {
    id: "odontologia",
    name: "Facultad de Odontología",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "odontologia",
      "dentista",
      "dientes",
      "estomatologia",
      "facultad de odontologia",
    ],
    description:
      "Forma odontólogos y cuenta con clínica propia donde los estudiantes realizan prácticas supervisadas.",
    careers: ["Odontología"],

    coordinate: { latitude: -12.054037, longitude: -77.085411 },
  },
  {
    id: "educacion",
    name: "Facultad de Educación",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "educacion",
      "pedagogia",
      "docente",
      "ensenanza",
      "facultad de educacion",
    ],
    description:
      "Forma docentes y pedagogos. Cuenta con laboratorios de enseñanza y sala de cómputo.",
    careers: ["Educación", "Educación Física"],

    coordinate: { latitude: -12.054696, longitude: -77.084633 },
  },
  {
    id: "letras-humanidades",
    name: "Facultad de Letras y Ciencias Humanas",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "letras",
      "humanidades",
      "literatura",
      "linguistica",
      "filosofia",
      "historia",
      "facultad de letras",
    ],
    description:
      "Única universidad de Lima con carrera de Historia del Arte y única del Perú con Conservación y Restauración. Tiene tres auditorios, biblioteca especializada y Centro de Idiomas.",
    phone: "619-7000",
    annex: "2802",
    careers: [
      "Literatura",
      "Lingüística",
      "Filosofía",
      "Historia",
      "Arte",
      "Conservación y Restauración",
      "Danza",
      "Bibliotecología y Ciencias de la Información",
      "Comunicación Social",
      "Lenguas",
      "Traducción e Interpretación",
    ],

    coordinate: { latitude: -12.057106, longitude: -77.081417 },
  },
  {
    id: "ciencias-sociales",
    name: "Facultad de Ciencias Sociales",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "ciencias sociales",
      "sociologia",
      "antropologia",
      "trabajo social",
      "arqueologia",
    ],
    description:
      "Patio interior con mesas y bancas de uso libre para estudiantes de toda la universidad. Muy cercana al Estadio Olímpico.",
    phone: "619-7000",
    careers: [
      "Sociología",
      "Antropología",
      "Trabajo Social",
      "Arqueología",
      "Ciencia Política y Gobernabilidad",
      "Geografía",
    ],

    coordinate: { latitude: -12.057896, longitude: -77.081176 },
  },
  {
    id: "ciencias-biologicas",
    name: "Facultad de Ciencias Biológicas",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "biologia",
      "biologicas",
      "ciencias biologicas",
      "microbiologia",
      "genetica",
      "ecologia",
    ],
    description:
      "Principal centro de investigación biológica del Perú. Sus laboratorios identifican nuevas especies cada año.",
    phone: "619-7000",
    careers: [
      "Biología",
      "Microbiología y Parasitología",
      "Genética y Biotecnología",
    ],

    coordinate: { latitude: -12.0594, longitude: -77.082 },
  },
  {
    id: "ciencias-fisicas",
    name: "Facultad de Ciencias Físicas",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: ["fisica", "ciencias fisicas", "fisico", "astrofisica", "optica"],
    description:
      "Investigación en astrofísica, óptica y física aplicada. Centro de referencia en ciencias básicas a nivel nacional.",
    careers: ["Física", "Física Médica"],

    coordinate: { latitude: -12.059594, longitude: -77.081883 },
  },
  {
    id: "ciencias-matematicas",
    name: "Facultad de Ciencias Matemáticas",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "matematicas",
      "matematica",
      "estadistica",
      "computacion cientifica",
      "investigacion operativa",
    ],
    description:
      "Inició funciones en 1850. Forma matemáticos, estadísticos e investigadores en computación científica.",
    phone: "619-7000",
    careers: [
      "Matemática",
      "Estadística",
      "Investigación Operativa",
      "Computación Científica",
    ],

    coordinate: { latitude: -12.060165, longitude: -77.081778 },
  },
  {
    id: "ciencias-administrativas",
    name: "Facultad de Ciencias Administrativas",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "administracion",
      "administrativas",
      "turismo",
      "hoteleria",
      "gestion empresarial",
    ],
    description:
      "Orígenes en 1875. Tiene maestría en Ciencias Administrativas con 6 menciones. Forma administradores con visión estratégica y proyección internacional.",
    phone: "619-7000",
    careers: [
      "Administración",
      "Administración de Turismo",
      "Administración de Negocios Internacionales",
    ],

    coordinate: { latitude: -12.05742, longitude: -77.081001 },
  },
  {
    id: "ciencias-contables",
    name: "Facultad de Ciencias Contables",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "contabilidad",
      "contables",
      "auditoria",
      "finanzas",
      "tributacion",
    ],
    description:
      "Forma contadores públicos y auditores. Orientada a finanzas, auditoría y tributación.",
    careers: ["Contabilidad"],

    coordinate: { latitude: -12.057643, longitude: -77.079975 },
  },
  {
    id: "ciencias-economicas",
    name: "Facultad de Ciencias Económicas",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "economia",
      "economicas",
      "economista",
      "macroeconomia",
      "microeconomia",
    ],
    description:
      "Edificio moderno con estacionamiento. Forma economistas con sólida base teórica y cuantitativa.",
    phone: "619-7000",
    careers: ["Economía"],

    coordinate: { latitude: -12.052943, longitude: -77.085795 },
  },
  {
    id: "derecho",
    name: "Facultad de Derecho y Ciencia Política",
    schedule: "Lun–Sáb 8:00–22:00",
    keywords: [
      "derecho",
      "ciencia politica",
      "abogado",
      "leyes",
      "facultad de derecho",
      "fdcp",
      "juridica",
      "jurisprudencia",
    ],
    description:
      "Una de las facultades más antiguas de la UNMSM, con antecedentes desde 1551. Tiene dos edificios (uno para Derecho, otro nuevo para Ciencia Política).",
    phone: "(01) 452-0550",
    careers: ["Derecho", "Ciencia Política"],

    coordinate: { latitude: -12.058368, longitude: -77.080267 },
  },
  // =============== OTROS LUGARES DEL CAMPUS ===============
  {
    id: "cepreunmsm",
    name: "Centro Preuniversitario UNMSM (CEPREUNMSM)",
    schedule: "Según ciclo académico vigente · Consultar en cepre.unmsm.edu.pe",
    keywords: [
      "cepreunmsm",
      "cepre",
      "preuniversitario",
      "pre",
      "preparatoria",
      "academia",
      "postulante",
      "admision",
    ],
    description:
      "Academia preparatoria oficial de la UNMSM. Los alumnos que ocupan una vacante en el cuadro de méritos acceden a la UNMSM sin rendir el examen ordinario.",

    coordinate: {
      latitude: -12.052081047265574,
      longitude: -77.08541222439179,
    },
  },
  {
    id: "huaca-san-marcos",
    name: "Huaca San Marcos",
    schedule: "Acceso libre dentro del campus",
    keywords: [
      "huaca",
      "huaca san marcos",
      "arqueologia",
      "cultura maranga",
      "monumento arqueologico",
      "patrimonio",
      "historia",
    ],
    description:
      "Gran estructura ceremonial prehispánica (330 m × 135 m × 32 m de altura) construida por la Cultura Lima a partir del siglo V d.C. Es un monumento arqueológico protegido por ley.",

    coordinate: { latitude: -12.059995, longitude: -77.086027 },
  },
  {
    id: "posgrado",
    name: "Escuela de Posgrado UNMSM",
    schedule: "Lun–Vie 8:00–20:00",
    keywords: [
      "posgrado",
      "maestria",
      "doctorado",
      "escuela de posgrado",
      "segunda especialidad",
      "dgep",
    ],
    description:
      "Ofrece 130 programas de maestría, 34 de doctorado y 133 de segundas especialidades en las 5 áreas del conocimiento de la universidad.",

    coordinate: { latitude: -12.052401, longitude: -77.085791 },
  },
];

/** Devuelve un lugar del campus por su id, o `undefined` si no existe. */
export function getCampusPlaceById(id: string): CampusPlace | undefined {
  return CAMPUS_PLACES.find((place) => place.id === id);
}

export const UNMSM_POIS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08761951511643, -12.051880164062666],
      },
      properties: {
        id: "1",
        nombre: "Puerta 8",
        categoria: "Puertas",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08454506116111, -12.053801766665373],
      },
      properties: {
        id: "2",
        nombre: "Puerta 7",
        categoria: "Puertas",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08001732406147, -12.057136012331654],
      },
      properties: {
        id: "3",
        nombre: "Puerta 3",
        categoria: "Puertas",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.07936395135454, -12.059496369475596],
      },
      properties: {
        id: "4",
        nombre: "Puerta 2",
        categoria: "Puertas",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08583596979169, -12.060949126150703],
      },
      properties: {
        id: "5",
        nombre: "Puerta 1",
        categoria: "Puertas",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0837569, -12.0544354],
      },
      properties: {
        id: "6",
        nombre: "Puerta 6",
        categoria: "Puertas",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0824707, -12.0551539],
      },
      properties: {
        id: "7",
        nombre: "Puerta 5",
        categoria: "Puertas",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0857217, -12.0535548],
      },
      properties: {
        id: "8",
        nombre: "Facultad de Ingeniería de Sistemas e Informática",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0875399, -12.0533466],
      },
      properties: {
        id: "9",
        nombre: "Escuela Profesional de Enfermería y Tecnología Médica",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0867638, -12.0535766],
      },
      properties: {
        id: "10",
        nombre: "Facultad de Psicología",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0869915, -12.0552369],
      },
      properties: {
        id: "11",
        nombre: "Facultad de Electrónica (Nuevo Pabellón)",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.087094, -12.0558976],
      },
      properties: {
        id: "12",
        nombre: "Facultad de Ingeniería Civil",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.087094, -12.0558976],
      },
      properties: {
        id: "13",
        nombre: "Escuela Profesional de Ing. de Mecanica de Fluidos",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0860475, -12.0555738],
      },
      properties: {
        id: "14",
        nombre: "Escuela Profesional de Ingeniería Geografica",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0851319, -12.0554579],
      },
      properties: {
        id: "15",
        nombre: "Facultad de Educación",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0848002, -12.0549302],
      },
      properties: {
        id: "16",
        nombre: "Facultad de Educación Física",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.084739, -12.0607884],
      },
      properties: {
        id: "17",
        nombre: "Facultad de Ingeniería Geológica, Minera y Metalúrgica",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.084194, -12.06022],
      },
      properties: {
        id: "18",
        nombre: "Facultad de Ingeniería Geológica",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0835806, -12.060074],
      },
      properties: {
        id: "19",
        nombre: "Facultad de Ingeniería Quimica y Textil",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0820091, -12.0594417],
      },
      properties: {
        id: "20",
        nombre: "Facultad de Ciencias Biológicas",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0818206, -12.0595585],
      },
      properties: {
        id: "21",
        nombre: "Facultad de Ciencias Físicas",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0823088, -12.0605261],
      },
      properties: {
        id: "22",
        nombre: "Facultad de Ciencias Matemáticas",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0813687, -12.0577069],
      },
      properties: {
        id: "24",
        nombre: "Facultad de Ciencias Admistrativas",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08711538327728, -12.056742771805922],
      },
      properties: {
        id: "23",
        nombre: "Facultad de Ingeniería de Mecánica de Fluidos",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0810172955949, -12.059839524439091],
      },
      properties: {
        id: "25",
        nombre: "Facultad de Ingeniería Industrial",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0816666, -12.0579798],
      },
      properties: {
        id: "26",
        nombre: "Facultad de Ciencias Sociales",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0811987, -12.0580466],
      },
      properties: {
        id: "27",
        nombre: "Facultad de Ciencias Economicas (Antiguo)",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0804619, -12.0576735],
      },
      properties: {
        id: "28",
        nombre: "Facultad de Ciencias Contables",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0814113, -12.0574376],
      },
      properties: {
        id: "29",
        nombre: "Facultad de Letras y Humanidades",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0857825, -12.0541478],
      },
      properties: {
        id: "30",
        nombre: "Facultad de Odontología",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.086256, -12.0534471],
      },
      properties: {
        id: "31",
        nombre: "Facultad de Ciencias Economicas (Nuevo)",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0876297, -12.052315],
      },
      properties: {
        id: "32",
        nombre: "Facultad de Ingeniería de Minas",
        categoria: "Facultades",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0838174, -12.0600503],
      },
      properties: {
        id: "33",
        nombre: "Cafeteria de la Facultad de Ingeniería Quimica",
        categoria: "Cafeterias",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.085277, -12.0547815],
      },
      properties: {
        id: "34",
        nombre: "Cafeteria de la Facultad de Odontología",
        categoria: "Cafeterias",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0872794, -12.0562339],
      },
      properties: {
        id: "35",
        nombre: "Cafeteria de la Facultad de Ingeniería Civil",
        categoria: "Cafeterias",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0811103, -12.0560269],
      },
      properties: {
        id: "36",
        nombre: "Puerta 4",
        categoria: "Puertas",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0860517, -12.05667],
      },
      properties: {
        id: "37",
        nombre: "Auditorio Ella Dumber Temple",
        categoria: "Auditorios",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.085161, -12.0555951],
      },
      properties: {
        id: "38",
        nombre: "Auditorio Rosa Alarco Larraburre",
        categoria: "Auditorios",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0852821, -12.0528848],
      },
      properties: {
        id: "39",
        nombre: "Cancha de la Facultad de Ingeniería de Sistemas e Informática",
        categoria: "Campos deportivos",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.0869071, -12.0519369],
      },
      properties: {
        id: "40",
        nombre: "Cancha de la Facultad de Ingeniería de Minas",
        categoria: "Campos deportivos",
      },
    },

    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08133086222188, -12.056323230913081],
      },
      properties: {
        id: "41",
        nombre:
          "Facultad de Ingeniería Electrónica y Eléctrica (Antiguo Pabellón)",
        categoria: "Facultades",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-77.08068780320625, -12.058514621805058],
      },
      properties: {
        id: "42",
        nombre: "Facultad de Derecho y Ciencia Política",
        categoria: "Facultades",
      },
    },

    // --- LA LÍNEA DEL CAMINO ---
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [-77.08583367924176, -12.060946483706246],
          [-77.085802308228, -12.060913016219672],
          [-77.08577378912418, -12.060862814982897],
          [-77.08573291174211, -12.06085444810904],
          [-77.0856948862705, -12.06087954872983],
          [-77.08563499615242, -12.060914875524944],
          [-77.08555514266182, -12.06095670988124],
          [-77.0854277573318, -12.061036659966604],
          [-77.0853821267654, -12.061046886139067],
          [-77.08526709971359, -12.061052464051016],
          [-77.08517488794475, -12.061053393702707],
          [-77.08499331454735, -12.061021784372073],
          [-77.08482410119834, -12.061003191330357],
          [-77.08471002478302, -12.060992035504299],
          [-77.08443529099578, -12.060955779148571],
          [-77.08425847255243, -12.060935326797178],
          [-77.08404631582584, -12.06091413538826],
          [-77.08380010089662, -12.060882527203091],
          [-77.08355870846688, -12.06085076995096],
          [-77.0834142116743, -12.060834036203147],
          [-77.08329253016517, -12.060814513494918],
          [-77.08317084865551, -12.060797779743922],
          [-77.08291522048323, -12.060772469587292],
          [-77.08273269821905, -12.060751087569187],
          [-77.08251880494058, -12.060715760752544],
          [-77.08236290441842, -12.060696961443696],
          [-77.0821756289703, -12.06066535323292],
          [-77.08200261307438, -12.060623518831136],
          [-77.08181207648228, -12.060581484219753],
          [-77.08165997459535, -12.060552664957484],
          [-77.08155445391134, -12.060529423613986],
          [-77.0812517923133, -12.060456654915711],
          [-77.08113676526149, -12.06042597633143],
          [-77.0808848485434, -12.060362760753222],
          [-77.08078027849636, -12.060333941466482],
          [-77.08057589158567, -12.060281880812667],
          [-77.08033708272171, -12.060220953488425],
          [-77.0800861146081, -12.060152159020404],
          [-77.07992446797208, -12.060102255089305],
          [-77.07980658900935, -12.060052053700758],
          [-77.07975620525954, -12.060001852302804],
          [-77.07971722915096, -12.059947932271584],
          [-77.07967730240588, -12.05989494188725],
          [-77.07965353648594, -12.059817780429341],
          [-77.07965383662601, -12.059727553961139],
          [-77.07966334299378, -12.05963365863245],
          [-77.07966429363077, -12.059609487552592],
          [-77.07962626815916, -12.059597402011889],
          [-77.0795692299515, -12.059572301271075],
          [-77.07951219174385, -12.059541622585627],
          [-77.07947036372484, -12.059517451497484],
          [-77.07943138761624, -12.059495139721363],
          [-77.0793657936778, -12.059495139721363],
        ],
      },
      properties: {
        id: "ruta_prueba",
        tipo: "camino_peatonal",
        color: "#512DA8",
      },
    },
  ],
};

export const ALL_SEARCHABLE_PLACES: CampusPlace[] = [
  ...CAMPUS_PLACES,
  ...UNMSM_POIS.features
    .filter((f) => f.geometry.type === "Point")
    .map((f: any) => ({
      id: f.properties.id,
      name: f.properties.nombre,
      schedule: "Campus UNMSM",
      keywords: [
        f.properties.nombre.toLowerCase(),
        f.properties.categoria?.toLowerCase() || "",
      ],
      coordinate: {
        longitude: f.geometry.coordinates[0],
        latitude: f.geometry.coordinates[1],
      },
    })),
];
