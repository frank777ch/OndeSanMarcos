import type { LngLat } from '../constants/campus'

export type PlaceCategoryId =
  | 'facultades'
  | 'cafeterias'
  | 'auditorios'
  | 'campos-deportivos'
  | 'puertas'

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
}

/** Categorías en el orden en que se muestran los filtros. */
export const PLACE_CATEGORIES: PlaceCategory[] = [
  { id: 'facultades', label: 'Facultades', color: '#3056ac' },
  { id: 'cafeterias', label: 'Cafeterías', color: '#ff8f10' },
  { id: 'auditorios', label: 'Auditorios', color: '#8e44ad' },
  { id: 'campos-deportivos', label: 'Campos deportivos', color: '#2e9e57' },
  { id: 'puertas', label: 'Puertas', color: '#e74c3c' },
]

/** Lugares del campus (puntos de interés). Coordenadas aproximadas. */
export const PLACES: Place[] = [
  {
    id: "1",
    name: "Puerta 8",
    category: 'puertas',
    coordinates: [-77.08761951511643, -12.051880164062666],
  },
  {
    id: "2",
    name: "Puerta 7",
    category: 'puertas',
    coordinates: [-77.08454506116111, -12.053801766665373],
  },
  {
    id: "3",
    name: "Puerta 3",
    category: 'puertas',
    coordinates: [-77.08001732406147, -12.057136012331654],
  },
  {
    id: "4",
    name: "Puerta 2",
    category: 'puertas',
    coordinates: [-77.07936395135454, -12.059496369475596],
  },
  {
    id: "5",
    name: "Puerta 1",
    category: 'puertas',
    coordinates: [-77.08583596979169, -12.060949126150703],
  },
  {
    id: "6",
    name: "Puerta 6",
    category: 'puertas',
    coordinates: [-77.0837569, -12.0544354],
  },
  {
    id: "7",
    name: "Puerta 5",
    category: 'puertas',
    coordinates: [-77.0824707, -12.0551539],
  },
  {
    id: "8",
    name: "Facultad de Ingeniería de Sistemas e Informática",
    category: 'facultades',
    coordinates: [-77.0857217, -12.0535548],
  },
  {
    id: "9",
    name: "Escuela Profesional de Enfermería y Tecnología Médica",
    category: 'facultades',
    coordinates: [-77.08731436531114, -12.053249259683904],
  },
  {
    id: "10",
    name: "Facultad de Psicología",
    category: 'facultades',
    coordinates: [-77.0867638, -12.0535766],
  },
  {
    id: "11",
    name: "Facultad de Electrónica (Nuevo Pabellón)",
    category: 'facultades',
    coordinates: [-77.0869915, -12.0552369],
  },
  {
    id: "12",
    name: "Facultad de Ingeniería Civil",
    category: 'facultades',
    coordinates: [-77.087094, -12.0558976],
  },
  {
    id: "13",
    name: "Escuela Profesional de Ing. de Mecanica de Fluidos",
    category: 'facultades',
    coordinates: [-77.087094, -12.0558976],
  },
  {
    id: "14",
    name: "Escuela Profesional de Ingeniería Geografica",
    category: 'facultades',
    coordinates: [-77.0860475, -12.0555738],
  },
  {
    id: "15",
    name: "Facultad de Educación",
    category: 'facultades',
    coordinates: [-77.0851319, -12.0554579],
  },
  {
    id: "16",
    name: "Facultad de Educación Física",
    category: 'facultades',
    coordinates: [-77.084732, -12.054717],
  },
  {
    id: "17",
    name: "Facultad de Ingeniería Geológica, Minera y Metalúrgica",
    category: 'facultades',
    coordinates: [-77.084739, -12.0607884],
  },
  {
    id: "18",
    name: "Facultad de Ingeniería Geológica",
    category: 'facultades',
    coordinates: [-77.084194, -12.06022],
  },
  {
    id: "19",
    name: "Facultad de Ingeniería Quimica y Textil",
    category: 'facultades',
    coordinates: [-77.0835806, -12.060074],
  },
  {
    id: "20",
    name: "Facultad de Ciencias Biológicas",
    category: 'facultades',
    coordinates: [-77.08205978986605, -12.0596728770671],
  },
  {
    id: "21",
    name: "Facultad de Ciencias Físicas",
    category: 'facultades',
    coordinates: [-77.0818206, -12.0595585],
  },
  {
    id: "22",
    name: "Facultad de Ciencias Matemáticas",
    category: 'facultades',
    coordinates: [-77.0823088, -12.0605261],
  },
  {
    id: "23",
    name: "Facultad de Ingeniería Industrial",
    category: 'facultades',
    coordinates: [-77.0809839, -12.0600774],
  },
  {
    id: "24",
    name: "Facultad de Ciencias Admistrativas",
    category: 'facultades',
    coordinates: [-77.0813687, -12.0577069],
  },
  {
    id: "25",
    name: "Facultad de Ingeniería Industrial",
    category: 'facultades',
    coordinates: [-77.0804662, -12.0596003],
  },
  {
    id: "26",
    name: "Facultad de Ciencias Sociales",
    category: 'facultades',
    coordinates: [-77.0816666, -12.0579798],
  },
  {
    id: "27",
    name: "Facultad de Ciencias Economicas (Antiguo)",
    category: 'facultades',
    coordinates: [-77.0811987, -12.0580466],
  },
  {
    id: "28",
    name: "Facultad de Ciencias Contables",
    category: 'facultades',
    coordinates: [-77.0804619, -12.0576735],
  },
  {
    id: "29",
    name: "Facultad de Letras y Humanidades",
    category: 'facultades',
    coordinates: [-77.0814113, -12.0574376],
  },
  {
    id: "30",
    name: "Facultad de Odontología",
    category: 'facultades',
    coordinates: [-77.08604219318228, -12.054134481058806],
  },
  {
    id: "31",
    name: "Facultad de Ciencias Economicas (Nuevo)",
    category: 'facultades',
    coordinates: [-77.086256, -12.0534471],
  },
  {
    id: "32",
    name: "Facultad de Ingeniería de Minas",
    category: 'facultades',
    coordinates: [-77.0876297, -12.052315],
  },
  {
    id: "33",
    name: "Cafeteria de la Facultad de Ingeniería Quimica",
    category: 'cafeterias',
    coordinates: [-77.08361038902244, -12.060082360827014],
  },
  {
    id: "34",
    name: "Cafeteria de la Facultad de Odontología",
    category: 'cafeterias',
    coordinates: [-77.08514887439485, -12.054603716785754],
  },
  {
    id: "35",
    name: "Cafeteria de la Facultad de Ingeniería Civil",
    category: 'cafeterias',
    coordinates: [-77.0872794, -12.0562339],
  },
  {
    id: "36",
    name: "Puerta 4",
    category: 'puertas',
    coordinates: [-77.0811103, -12.0560269],
  },
  {
    id: "37",
    name: "Auditorio Ella Dumber Temple",
    category: 'auditorios',
    coordinates: [-77.0860517, -12.05667],
  },
  {
    id: "38",
    name: "Auditorio Rosa Alarco Larraburre",
    category: 'auditorios',
    coordinates: [-77.08521854944695, -12.055838267297563],
  },
  {
    id: "39",
    name: "Cancha de la Facultad de Ingeniería de Sistemas e Informática",
    category: 'campos-deportivos',
    coordinates: [-77.0852821, -12.0528848],
  },
  {
    id: "40",
    name: "Cancha de la Facultad de Ingeniería de Minas",
    category: 'campos-deportivos',
    coordinates: [-77.0869071, -12.0519369],
  },
]
