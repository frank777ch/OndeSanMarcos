/** Longitud/latitud en el orden que usa Mapbox: [lng, lat]. */
export type LngLat = [number, number]

export const CAMPUS = {
  center: [-77.0827, -12.0565] as LngLat,
  camera: { zoom: 16, pitch: 60, bearing: 0 },
  /** Esquinas del campus: suroeste y noreste. */
  bounds: {
    sw: [-77.09, -12.064] as LngLat,
    ne: [-77.075, -12.049] as LngLat,
  },
  /** Margen (en grados) que se permite explorar fuera del campus. */
  margin: 0.006,
  minZoom: 14,
  maxZoom: 21,
} as const

/** Límites de navegación: el campus más un margen alrededor. */
export const CAMPUS_MAX_BOUNDS: [LngLat, LngLat] = [
  [CAMPUS.bounds.sw[0] - CAMPUS.margin, CAMPUS.bounds.sw[1] - CAMPUS.margin],
  [CAMPUS.bounds.ne[0] + CAMPUS.margin, CAMPUS.bounds.ne[1] + CAMPUS.margin],
]
