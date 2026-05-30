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
}

/**
 * Lugares del campus.
 * Las coordenadas son aproximadas (datos de demo) y están dentro de los
 * `bounds` de la UNMSM. Sirven tanto al mapa como al mock del asistente.
 */
export const CAMPUS_PLACES: CampusPlace[] = [
  {
    id: "rectorado",
    name: "Rectorado",
    schedule: "Lun–Vie 8:00–17:00",
    keywords: ["rectorado", "rector", "administracion central"],
    coordinate: { latitude: -12.056524, longitude: -77.086253 },
  },
  {
    id: "comedor-universitario",
    name: "Comedor Universitario",
    schedule: "Lun–Vie 12:00–14:30",
    keywords: ["comedor", "comedor universitario", "almuerzo"],
    coordinate: { latitude: -12.059444, longitude: -77.083053 },
  },
  {
    id: "auditorio-ela-dunbar-temple",
    name: "Auditorio Ela Dunbar Temple",
    schedule: "Según programación de eventos",
    keywords: ["auditorio", "ela dunbar", "dunbar temple", "ela dunbar temple"],
    coordinate: { latitude: -12.056644, longitude: -77.086096 },
  },
  {
    id: "biblioteca-central",
    name: "Biblioteca Central Pedro Zulen",
    schedule: "Lun–Sáb 8:00–21:00",
    keywords: ["biblioteca", "biblioteca central", "pedro zulen", "libros"],
    coordinate: {
      latitude: -12.055868939512747,
      longitude: -77.08586761087753,
    },
  },
  {
    id: "fisi",
    name: "Facultad de Ingeniería de Sistemas (FISI)",
    schedule: "Lun–Vie 7:00–22:00",
    keywords: ["fisi", "sistemas", "ingenieria de sistemas", "software"],
    coordinate: { latitude: -12.053679, longitude: -77.085711 },
  },
  {
    id: "estadio",
    name: "Estadio Universitario",
    schedule: "Lun–Dom 6:00–20:00",
    keywords: ["estadio", "cancha", "deporte", "futbol"],
    coordinate: { latitude: -12.060926, longitude: -77.085954 },
  },
  {
    id: "museo-historia-natural",
    name: "Cancha de Futbol - Gimnasio",
    schedule: "Mar–Dom 9:00–15:00",
    keywords: ["museo", "historia natural", "museo de historia"],
    coordinate: { latitude: -12.060084, longitude: -77.084272 },
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
        coordinates: [-77.0809839, -12.0600774],
      },
      properties: {
        id: "23",
        nombre: "Facultad de Ingeniería Industrial",
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
        coordinates: [-77.0804662, -12.0596003],
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
