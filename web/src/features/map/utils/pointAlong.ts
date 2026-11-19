import { haversine, type Coord } from '@/features/routing/utils/distance'

/** Punto que queda a `meters` metros del inicio de una línea, siguiéndola. Se limita a los extremos. */
export function pointAlong(path: Coord[], meters: number): Coord {
  if (path.length === 0) throw new Error('La línea no tiene puntos')
  let left = Math.max(0, meters)
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1]
    const to = path[i]
    const length = haversine(from, to)
    if (left <= length) {
      const t = length === 0 ? 0 : left / length
      return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
    }
    left -= length
  }
  return path[path.length - 1]
}
