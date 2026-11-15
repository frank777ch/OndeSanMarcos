import type { LngLat } from '@/features/map/constants/campus'

// TEMPORAL (ver useWalkwaysDebug).
export interface OsmWay {
  id: number
  highway: string
  footway?: string
  access?: string
  name?: string
  line: LngLat[]
}

export interface WalkwayKind {
  key: string
  label: string
  color: string
}

/** Categorías con las que se colorean las vías de OSM. El orden es el de la leyenda. */
export const KINDS: WalkwayKind[] = [
  { key: 'crossing', label: 'Cruce peatonal (footway=crossing)', color: '#d946ef' },
  { key: 'sidewalk', label: 'Vereda (footway=sidewalk)', color: '#06b6d4' },
  { key: 'foot', label: 'Peatonal (footway, path, pedestrian)', color: '#16a34a' },
  { key: 'steps', label: 'Escaleras', color: '#a16207' },
  { key: 'service', label: 'Servicio / vehicular interno', color: '#f59e0b' },
  { key: 'road', label: 'Calle / avenida', color: '#64748b' },
  { key: 'restricted', label: 'Acceso privado o prohibido', color: '#ef4444' },
]

export function kindOf(way: OsmWay): string {
  if (way.access === 'private' || way.access === 'no') return 'restricted'
  if (way.footway === 'crossing') return 'crossing'
  if (way.footway === 'sidewalk') return 'sidewalk'
  if (way.highway === 'steps') return 'steps'
  if (['footway', 'path', 'pedestrian', 'cycleway', 'track'].includes(way.highway)) return 'foot'
  if (way.highway === 'service') return 'service'
  return 'road'
}
