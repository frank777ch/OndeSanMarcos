import type { Feature, FeatureCollection, Point } from 'geojson'
import { CAMPUS, type LngLat } from '../constants/campus'
import type { UserPosition } from './geolocation'

export const USER_DOT_COLOR = '#2563eb'
/** Radio mínimo del halo, en píxeles, para que nunca quede tapado por el punto. */
export const MIN_HALO_PX = 14
export const HALO_MIN_ZOOM = 14
export const HALO_MAX_ZOOM = 22

/** Metros que cubre un píxel (teselas de 512 px) a un zoom y una latitud. */
export function metersPerPixel(zoom: number, latitude: number): number {
  return (78271.517 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom
}

/**
 * Pares [zoom, radio en px] para que el halo mida `accuracy` metros en el
 * terreno, con un mínimo visible. Se usa en una interpolación exponencial base 2.
 */
export function haloRadiusStops(accuracy: number, latitude: number): [number, number][] {
  const stops: [number, number][] = []
  for (let z = HALO_MIN_ZOOM; z <= HALO_MAX_ZOOM; z++) {
    stops.push([z, Math.max(MIN_HALO_PX, accuracy / metersPerPixel(z, latitude))])
  }
  return stops
}

/** Límites que incluyen a los actuales y al punto (más el margen del campus). */
export function expandBounds(
  bounds: [LngLat, LngLat],
  point: LngLat,
  margin: number = CAMPUS.margin,
): [LngLat, LngLat] {
  const [sw, ne] = bounds
  return [
    [Math.min(sw[0], point[0] - margin), Math.min(sw[1], point[1] - margin)],
    [Math.max(ne[0], point[0] + margin), Math.max(ne[1], point[1] + margin)],
  ]
}

export function userLocationToGeoJSON(
  position: UserPosition,
): FeatureCollection<Point, { accuracy: number }> {
  const feature: Feature<Point, { accuracy: number }> = {
    type: 'Feature',
    properties: { accuracy: position.accuracy },
    geometry: { type: 'Point', coordinates: position.coordinates },
  }
  return { type: 'FeatureCollection', features: [feature] }
}
