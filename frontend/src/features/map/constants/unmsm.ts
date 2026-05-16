export const UNMSM = {
  center: {
    latitude: -12.0565,
    longitude: -77.0827,
  },
  bounds: {
    ne: { latitude: -12.0490, longitude: -77.0750 },
    sw: { latitude: -12.0640, longitude: -77.0900 },
  },
  camera: {
    zoomLevel: 16,
    pitch: 45,
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
    id: 'rectorado',
    name: 'Rectorado',
    schedule: 'Lun–Vie 8:00–17:00',
    keywords: ['rectorado', 'rector', 'administracion central'],
    coordinate: { latitude: -12.0578, longitude: -77.084 },
  },
  {
    id: 'comedor-universitario',
    name: 'Comedor Universitario',
    schedule: 'Lun–Vie 12:00–14:30',
    keywords: ['comedor', 'comedor universitario', 'almuerzo'],
    coordinate: { latitude: -12.056, longitude: -77.081 },
  },
  {
    id: 'auditorio-ela-dunbar-temple',
    name: 'Auditorio Ela Dunbar Temple',
    schedule: 'Según programación de eventos',
    keywords: ['auditorio', 'ela dunbar', 'dunbar temple', 'ela dunbar temple'],
    coordinate: { latitude: -12.059, longitude: -77.0825 },
  },
  {
    id: 'biblioteca-central',
    name: 'Biblioteca Central Pedro Zulen',
    schedule: 'Lun–Sáb 8:00–21:00',
    keywords: ['biblioteca', 'biblioteca central', 'pedro zulen', 'libros'],
    coordinate: { latitude: -12.0568, longitude: -77.0838 },
  },
  {
    id: 'fisi',
    name: 'Facultad de Ingeniería de Sistemas (FISI)',
    schedule: 'Lun–Vie 7:00–22:00',
    keywords: ['fisi', 'sistemas', 'ingenieria de sistemas', 'software'],
    coordinate: { latitude: -12.054, longitude: -77.085 },
  },
  {
    id: 'estadio',
    name: 'Estadio Universitario',
    schedule: 'Lun–Dom 6:00–20:00',
    keywords: ['estadio', 'cancha', 'deporte', 'futbol'],
    coordinate: { latitude: -12.06, longitude: -77.08 },
  },
  {
    id: 'museo-historia-natural',
    name: 'Museo de Historia Natural',
    schedule: 'Mar–Dom 9:00–15:00',
    keywords: ['museo', 'historia natural', 'museo de historia'],
    coordinate: { latitude: -12.0552, longitude: -77.0805 },
  },
];

/** Devuelve un lugar del campus por su id, o `undefined` si no existe. */
export function getCampusPlaceById(id: string): CampusPlace | undefined {
  return CAMPUS_PLACES.find((place) => place.id === id);
}
