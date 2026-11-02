import { buildGraph, getCampusGraph, nearestNode, shortestPath } from './pathfinder'

const line = (...coordinates: [number, number][]) => ({ geometry: { type: 'LineString', coordinates } })
// 0,0001° ≈ 11 m
const A: [number, number] = [-77, -12]
const B: [number, number] = [-77, -11.999]
const C: [number, number] = [-77, -11.998]
const D: [number, number] = [-76.999, -11.999]
const E: [number, number] = [-76.99, -11.9]

describe('pathfinder', () => {
  it('RF-13.20: encuentra el camino más corto solo por aristas', () => {
    // A–B–C directo, y un rodeo A–D–C más largo
    const g = buildGraph({ features: [line(A, B, C), line(A, D, C)] })
    const from = nearestNode(g, A)!.id
    const to = nearestNode(g, C)!.id
    const found = shortestPath(g, from, to)!
    expect(found.nodes.map((i) => g.coords[i])).toEqual([A, B, C])
  })

  it('RF-13.20: une vértices a 5 m o menos en un mismo nodo', () => {
    const near: [number, number] = [-77, -11.99996] // ≈ 4,4 m de B
    const g = buildGraph({ features: [line(A, B), line(near, C)] })
    expect(g.coords).toHaveLength(3)
    const found = shortestPath(g, nearestNode(g, A)!.id, nearestNode(g, C)!.id)
    expect(found).not.toBeNull()
  })

  it('RF-13.24: sin conexión devuelve null', () => {
    const g = buildGraph({ features: [line(A, B), line(D, E)] })
    expect(shortestPath(g, nearestNode(g, A)!.id, nearestNode(g, E)!.id)).toBeNull()
  })

  it('nearestNode devuelve la distancia al nodo y null en un grafo vacío', () => {
    expect(nearestNode(buildGraph({}), A)).toBeNull()
    const g = buildGraph({ features: [line(A, B)] })
    expect(nearestNode(g, [-77, -11.9995])!.distance).toBeGreaterThan(0)
  })

  it('el grafo del campus tiene nodos y aristas', () => {
    const g = getCampusGraph()
    expect(g.coords.length).toBeGreaterThan(10)
    expect(g.edges.some((e) => e.length > 0)).toBe(true)
  })
})
