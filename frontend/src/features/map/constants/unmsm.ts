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

export const UNMSM_POIS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-77.08761951511643, -12.051880164062666] },
      properties: { 
        id: '1', 
        nombre: 'Puerta 8', 
        categoria: 'Puertas'
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-77.08454506116111, -12.053801766665373] },
      properties: { 
        id: '2', 
        nombre: 'Puerta 7', 
        categoria: 'Puertas' 
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-77.08001732406147, -12.057136012331654] },
      properties: { 
        id: '3', 
        nombre: 'Puerta 3', 
        categoria: 'Puertas' 
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-77.07936395135454, -12.059496369475596] },
      properties: { 
        id: '4', 
        nombre: 'Puerta 2', 
        categoria: 'Puertas' 
      }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-77.08583596979169, -12.060949126150703] },
      properties: { 
        id: '5', 
        nombre: 'Puerta 1', 
        categoria: 'Puertas' 
      }
    },

    // --- LA LÍNEA DEL CAMINO ---
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
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
          [-77.0793657936778, -12.059495139721363]
        ]
      },
      properties: { 
        id: 'ruta_prueba',
        tipo: 'camino_peatonal',
        color: '#512DA8'
      }
    }
  ]
};
