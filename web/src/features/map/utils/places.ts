import type { Place, PlaceCategoryId } from '../types'

/** Todos los lugares, o solo los de la categoría indicada. */
export function filterPlaces(
  places: Place[],
  category: PlaceCategoryId | null,
): Place[] {
  return category ? places.filter((p) => p.category === category) : places
}
