import { PLACES } from '../../map/data/places'
import { haversine } from './distance'
import { buildGraph, getCampusGraph, nearestNode, shortestPath } from './pathfinder'
import { MAX_ACCESS_DISTANCE, planRoute, type RoutePoint } from './planRoute'

const place = (placeId: string): RoutePoint => ({ kind: 'place', placeId })
const at = (coordinates: [number, number]): RoutePoint => ({ kind: 'my-location', coordinates })

const line = (...coordinates: [number, number][]) => ({ geometry: { type: 'LineString', coordinates } })
const A: [number, number] = [-77, -12]
const B: [number, number] = [-77, -11.999]
const C: [number, number] = [-76.99, -11.9]
const D: [number, number] = [-76.99, -11.899]

describe('planRoute', () => {
  const graph = buildGraph({ features: [line(A, B), line(C, D)] })

  it('RF-13.13: el mismo lugar como origen y destino no se calcula', () => {
    expect(planRoute(place('3'), place('3'))).toEqual({ ok: false, error: 'same-place' })
  })

  it('RF-13.22: la distancia suma el tramo de acceso, el camino y el tramo final', () => {
    const from: [number, number] = [-77.0002, -12]
    const to: [number, number] = [-77.0002, -11.999]
    const r = planRoute(at(from), at(to), graph)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const expected = haversine(from, A) + haversine(A, B) + haversine(B, to)
    expect(r.route.distance).toBeCloseTo(expected, 3)
    expect(r.route.path[0]).toEqual(from)
    expect(r.route.path[r.route.path.length - 1]).toEqual(to)
  })

  it('RF-13.20: si el punto está sobre el camino no repite coordenadas', () => {
    const r = planRoute(at(A), at(B), graph)
    expect(r.ok && r.route.path).toEqual([A, B])
  })

  it('RF-13.23: origen o destino a más de 150 m del camino', () => {
    const far: [number, number] = [-77.0016, -12] // ≈ 175 m
    expect(planRoute(at(far), at(B), graph)).toEqual({ ok: false, error: 'origin-too-far' })
    expect(planRoute(at(A), at(far), graph)).toEqual({ ok: false, error: 'destination-too-far' })
  })

  it('RF-13.23: a menos de 150 m sí se calcula', () => {
    const near: [number, number] = [-77.001, -12] // ≈ 109 m
    expect(MAX_ACCESS_DISTANCE).toBe(150)
    expect(planRoute(at(near), at(B), graph).ok).toBe(true)
  })

  it('RF-13.24: sin camino entre los dos puntos', () => {
    expect(planRoute(at(A), at(D), graph)).toEqual({ ok: false, error: 'no-path' })
  })

  it('RF-13.20: entre dos lugares reales la ruta tiene distancia y sigue los nodos del grafo', () => {
    const r = planRoute(place('biblioteca-central'), place('8'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.route.distance).toBeGreaterThan(0)
    const g = getCampusGraph()
    const inner = r.route.path.slice(1, -1)
    for (const c of inner) expect(g.coords.some((n) => haversine(n, c) === 0)).toBe(true)
  })
})

describe('datos reales del campus', () => {
  const g = getCampusGraph()

  it('RF-13.23: todos los lugares están a 150 m o menos de un camino', () => {
    const lejos = PLACES.filter((p) => nearestNode(g, p.coordinates)!.distance > MAX_ACCESS_DISTANCE)
    expect(lejos.map((p) => p.name)).toEqual([])
  })

  it('RF-13.24: todos los lugares quedan conectados entre sí', () => {
    const root = nearestNode(g, PLACES[0].coordinates)!.id
    const aisladas = PLACES.filter((p) => !shortestPath(g, root, nearestNode(g, p.coordinates)!.id))
    expect(aisladas.map((p) => p.name)).toEqual([])
  })
})
