import type { LngLat } from '../constants/campus'
import raw from './campus-osm.json'

/** Polígono: anillo exterior y, después, los huecos. Todas las coordenadas son [lng, lat]. */
export type Polygon = LngLat[][]

export interface CampusBuilding {
  footprint: Polygon
  /** Metros; viene de OpenStreetMap o es la altura por defecto. */
  height: number
  name?: string
}

export type GreenKind = 'grass' | 'park' | 'pitch' | 'water'

export interface CampusGreen {
  polygon: Polygon
  kind: GreenKind
}

/** Tramo de una avenida o calle que rodea al campus (solo unos metros más allá del contorno). */
export interface CampusRoad {
  kind: string
  line: LngLat[]
}

export interface CampusOsm {
  source: string
  license: string
  fetchedAt: string
  boundary: Polygon[]
  buildings: CampusBuilding[]
  green: CampusGreen[]
  roads: CampusRoad[]
}

/** Contorno, edificios y áreas verdes de la Ciudad Universitaria (ver scripts/fetch-campus-osm.mjs). */
export const campusOsm = raw as unknown as CampusOsm
