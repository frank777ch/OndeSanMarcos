export type Coord = [number, number] // [lng, lat]

const EARTH_RADIUS_M = 6_371_000

/** Distancia en metros entre dos puntos sobre la superficie terrestre (fórmula de haversine). */
export function haversine(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Longitud en metros de una línea. */
export function pathLength(coords: Coord[]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) total += haversine(coords[i - 1], coords[i])
  return total
}

/** «320 m» por debajo de 1000 m; «1,2 km» desde ahí. */
export function formatDistance(meters: number): string {
  const rounded = Math.round(meters)
  if (rounded < 1000) return `${rounded} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}
