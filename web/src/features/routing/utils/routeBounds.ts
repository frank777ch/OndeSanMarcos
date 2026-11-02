import type { Coord } from './distance'

/** Caja [suroeste, noreste] que contiene todos los puntos de la ruta. */
export function routeBounds(path: Coord[]): [Coord, Coord] {
  const lngs = path.map((c) => c[0])
  const lats = path.map((c) => c[1])
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}
