import type { Feature, FeatureCollection, Point } from 'geojson'
import type { Place, PlaceCategory, PlaceCategoryId } from '../types'

export type PlaceProperties = {
  id: string
  name: string
  category: PlaceCategoryId
  color: string
}

/** Color de un punto cuya categoría no se conoce (no debería ocurrir: la base lo impide). */
const FALLBACK_COLOR = '#757575'

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
  categories: PlaceCategory[],
): FeatureCollection<Point, PlaceProperties> {
  const colorByCategory = new Map(categories.map((c) => [c.id, c.color]))
  const features: Feature<Point, PlaceProperties>[] = places.map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: p.coordinates },
    properties: {
      id: p.id,
      name: p.name,
      category: p.category,
      color: colorByCategory.get(p.category) ?? FALLBACK_COLOR,
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
