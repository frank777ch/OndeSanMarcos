import type { Feature, FeatureCollection, Point } from 'geojson'
import {
  PLACE_CATEGORIES,
  type Place,
  type PlaceCategoryId,
} from '../data/places'

export type PlaceProperties = {
  id: string
  name: string
  category: PlaceCategoryId
  color: string
}

const COLOR_BY_CATEGORY = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.id, c.color]),
) as Record<PlaceCategoryId, string>

/** Todos los lugares, o solo los de la categoría indicada. */
export function filterPlaces(
  places: Place[],
  category: PlaceCategoryId | null,
): Place[] {
  return category ? places.filter((p) => p.category === category) : places
}

/** Convierte lugares a GeoJSON para una fuente de Mapbox. */
export function placesToGeoJSON(
  places: Place[],
): FeatureCollection<Point, PlaceProperties> {
  const features: Feature<Point, PlaceProperties>[] = places.map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: p.coordinates },
    properties: {
      id: p.id,
      name: p.name,
      category: p.category,
      color: COLOR_BY_CATEGORY[p.category],
    },
  }))
  return { type: 'FeatureCollection', features }
}

/** Id del lugar del primer punto tocado en el mapa, o `null` si no hay ninguno. */
export function placeIdFromFeatures(
  features: { properties?: Record<string, unknown> | null }[] | undefined,
): string | null {
  const id = features?.[0]?.properties?.id
  return typeof id === 'string' ? id : null
}
