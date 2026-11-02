import campusPaths from '../data/campus-paths.json'
import { haversine, type Coord } from './distance'

/** Dos vértices a esta distancia (m) o menos son el mismo nodo: une cruces mal digitalizados. */
export const MERGE_DISTANCE = 5

export interface Graph {
  coords: Coord[]
  /** Por nodo: lista de [vecino, peso en metros]. */
  edges: [number, number][][]
}

interface GeoJsonLike {
  features?: { geometry?: { type: string; coordinates: unknown } }[]
}

export function buildGraph(geojson: GeoJsonLike): Graph {
  const graph: Graph = { coords: [], edges: [] }

  const nodeFor = (c: Coord): number => {
    for (let i = 0; i < graph.coords.length; i++) {
      if (haversine(graph.coords[i], c) <= MERGE_DISTANCE) return i
    }
    graph.coords.push(c)
    graph.edges.push([])
    return graph.coords.length - 1
  }

  const addLine = (line: Coord[]) => {
    let prev: number | null = null
    for (const c of line) {
      const id = nodeFor(c)
      if (prev !== null && prev !== id) {
        const w = haversine(graph.coords[prev], graph.coords[id])
        if (!graph.edges[prev].some(([to]) => to === id)) graph.edges[prev].push([id, w])
        if (!graph.edges[id].some(([to]) => to === prev)) graph.edges[id].push([prev, w])
      }
      prev = id
    }
  }

  for (const f of geojson.features ?? []) {
    const g = f.geometry
    if (g?.type === 'LineString') addLine(g.coordinates as Coord[])
    else if (g?.type === 'MultiLineString') (g.coordinates as Coord[][]).forEach(addLine)
  }
  return graph
}

/** Nodo más cercano a un punto, con su distancia en metros; `null` si el grafo está vacío. */
export function nearestNode(graph: Graph, point: Coord): { id: number; distance: number } | null {
  let best: { id: number; distance: number } | null = null
  graph.coords.forEach((c, id) => {
    const distance = haversine(point, c)
    if (!best || distance < best.distance) best = { id, distance }
  })
  return best
}

/** Camino más corto (Dijkstra) entre dos nodos; `null` si no están conectados. */
export function shortestPath(
  graph: Graph,
  from: number,
  to: number,
): { nodes: number[]; distance: number } | null {
  const n = graph.coords.length
  const dist = new Array<number>(n).fill(Infinity)
  const prev = new Array<number>(n).fill(-1)
  const done = new Array<boolean>(n).fill(false)
  dist[from] = 0

  for (;;) {
    let u = -1
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < (u === -1 ? Infinity : dist[u])) u = i
    if (u === -1) return null
    if (u === to) break
    done[u] = true
    for (const [v, w] of graph.edges[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w
        prev[v] = u
      }
    }
  }

  const nodes: number[] = []
  for (let at = to; at !== -1; at = prev[at]) nodes.push(at)
  return { nodes: nodes.reverse(), distance: dist[to] }
}

let campusGraph: Graph | null = null
/** Grafo de los caminos del campus; se construye la primera vez que se pide. */
export function getCampusGraph(): Graph {
  campusGraph ??= buildGraph(campusPaths as GeoJsonLike)
  return campusGraph
}
