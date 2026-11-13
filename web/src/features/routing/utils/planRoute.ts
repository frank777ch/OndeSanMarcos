import { usePlacesStore } from '../../map/store/usePlacesStore'
import type { LngLat } from '../../map/constants/campus'
import { haversine, type Coord } from './distance'
import { getCampusGraph, nearestNode, shortestPath, type Graph } from './pathfinder'

/** Distancia máxima (m) del origen o del destino al camino más cercano (RF-13.23). */
export const MAX_ACCESS_DISTANCE = 150

export type RoutePoint =
  | { kind: 'place'; placeId: number }
  | { kind: 'my-location'; coordinates: LngLat }

export interface PlannedRoute {
  origin: RoutePoint
  destination: RoutePoint
  /** Origen → tramo de acceso → caminos → tramo de acceso → destino. */
  path: Coord[]
  /** Metros: caminos más tramos de acceso. */
  distance: number
}

export type RouteError = 'same-place' | 'origin-too-far' | 'destination-too-far' | 'no-path'
export type RouteResult = { ok: true; route: PlannedRoute } | { ok: false; error: RouteError }

export function pointCoordinates(point: RoutePoint): LngLat | null {
  if (point.kind === 'my-location') return point.coordinates
  return usePlacesStore.getState().byId[point.placeId]?.coordinates ?? null
}

export function pointLabel(point: RoutePoint): string {
  if (point.kind === 'my-location') return 'Mi ubicación'
  return usePlacesStore.getState().byId[point.placeId]?.name ?? ''
}

export function planRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  graph: Graph = getCampusGraph(),
): RouteResult {
  if (origin.kind === 'place' && destination.kind === 'place' && origin.placeId === destination.placeId) {
    return { ok: false, error: 'same-place' }
  }
  const from = pointCoordinates(origin)
  const to = pointCoordinates(destination)
  if (!from || !to) return { ok: false, error: 'no-path' }

  const start = nearestNode(graph, from)
  if (!start || start.distance > MAX_ACCESS_DISTANCE) return { ok: false, error: 'origin-too-far' }
  const end = nearestNode(graph, to)
  if (!end || end.distance > MAX_ACCESS_DISTANCE) return { ok: false, error: 'destination-too-far' }

  const found = shortestPath(graph, start.id, end.id)
  if (!found) return { ok: false, error: 'no-path' }

  const path: Coord[] = [from]
  for (const id of found.nodes) {
    const c = graph.coords[id]
    if (haversine(path[path.length - 1], c) > 0) path.push(c)
  }
  if (haversine(path[path.length - 1], to) > 0) path.push(to)

  const distance = start.distance + found.distance + end.distance
  return { ok: true, route: { origin, destination, path, distance } }
}
