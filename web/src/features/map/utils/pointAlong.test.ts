import { haversine, type Coord } from '@/features/routing/utils/distance'
import { pointAlong } from './pointAlong'

// Dos tramos: primero hacia el este, luego hacia el norte.
const A: Coord = [-77.08, -12.05]
const B: Coord = [-77.079, -12.05]
const C: Coord = [-77.079, -12.049]
const PATH = [A, B, C]

describe('pointAlong', () => {
  it('en 0 m devuelve el inicio y pasado el final devuelve el final', () => {
    expect(pointAlong(PATH, 0)).toEqual(A)
    expect(pointAlong(PATH, 1e6)).toEqual(C)
    expect(pointAlong(PATH, -5)).toEqual(A)
  })

  it('a mitad del primer tramo queda en medio de A y B', () => {
    const p = pointAlong(PATH, haversine(A, B) / 2)
    expect(p[0]).toBeCloseTo((A[0] + B[0]) / 2, 8)
    expect(p[1]).toBeCloseTo(A[1], 8)
  })

  it('después del primer tramo sigue por el segundo', () => {
    const p = pointAlong(PATH, haversine(A, B) + haversine(B, C) / 2)
    expect(p[0]).toBeCloseTo(B[0], 8)
    expect(p[1]).toBeCloseTo((B[1] + C[1]) / 2, 8)
  })

  it('con un solo punto devuelve ese punto', () => {
    expect(pointAlong([A], 10)).toEqual(A)
  })
})
