import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import type { FeatureCollection, LineString } from 'geojson'
import type { LngLat } from '@/features/map/constants/campus'
import { toLocal } from '@/features/map/utils/projection'
import { ORDER } from '@/features/map/scene/order'
import campusPaths from '../data/campus-paths.json'
import osm from '../data/osm-walkways.json'
import { KINDS, kindOf, type OsmWay } from './walkwayKinds'
import { useWalkwaysDebug } from './useWalkwaysDebug'

export const OSM_WAYS = osm.ways as unknown as OsmWay[]
export const CURRENT_COLOR = '#2563eb'

type P = [number, number, number]

/** Pares de puntos consecutivos (para `Line segments`), así cada categoría es un solo objeto. */
function segmentsOf(lines: LngLat[][], y: number): P[] {
  const out: P[] = []
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = toLocal(line[i])
      const [bx, bz] = toLocal(line[i + 1])
      out.push([ax, y, az], [bx, y, bz])
    }
  }
  return out
}

/** TEMPORAL: dibuja encima del mapa los caminos actuales (azul) y las vías de OSM por categoría. */
export function WalkwaysDebugLayer() {
  const visible = useWalkwaysDebug((s) => s.visible)

  const layers = useMemo(() => {
    const current = (campusPaths as FeatureCollection<LineString>).features.map((f) => f.geometry.coordinates as LngLat[])
    const byKind = new Map<string, LngLat[][]>()
    for (const way of OSM_WAYS) {
      const k = kindOf(way)
      byKind.set(k, [...(byKind.get(k) ?? []), way.line])
    }
    return {
      current: segmentsOf(current, 0.6),
      osm: KINDS.map((k) => ({ ...k, points: segmentsOf(byKind.get(k.key) ?? [], 0.8) })),
    }
  }, [])

  if (!visible) return null
  return (
    <>
      <Line segments points={layers.current} color={CURRENT_COLOR} lineWidth={9} transparent opacity={0.45} depthTest={false} renderOrder={ORDER.overlay} />
      {layers.osm.map(
        (k) =>
          k.points.length > 0 && (
            <Line key={k.key} segments points={k.points} color={k.color} lineWidth={2.5} depthTest={false} renderOrder={ORDER.overlay + 1} />
          ),
      )}
    </>
  )
}
