import { CAMPUS, type LngLat } from '../constants/campus'

const METERS_PER_DEGREE_LAT = 111_320
const COS_LAT = Math.cos((CAMPUS.center[1] * Math.PI) / 180)

/** Metros al este (x) y al sur (z) de `CAMPUS.center`; `y` queda libre para la altura. */
export type Local = [x: number, z: number]

/** lng/lat → metros locales (equirectangular: el error es despreciable en ~1,5 km). Norte = -z. */
export function toLocal([lng, lat]: LngLat): Local {
  return [
    (lng - CAMPUS.center[0]) * METERS_PER_DEGREE_LAT * COS_LAT,
    -(lat - CAMPUS.center[1]) * METERS_PER_DEGREE_LAT,
  ]
}

/** Inversa de `toLocal`. */
export function fromLocal([x, z]: Local): LngLat {
  return [
    CAMPUS.center[0] + x / (METERS_PER_DEGREE_LAT * COS_LAT),
    CAMPUS.center[1] - z / METERS_PER_DEGREE_LAT,
  ]
}
