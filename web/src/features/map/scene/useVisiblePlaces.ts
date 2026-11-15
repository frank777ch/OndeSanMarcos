import { useMemo } from 'react'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'
import { filterPlaces } from '../utils/places'
import { toLocal } from '../utils/projection'

const FALLBACK_COLOR = '#757575'

export interface VisiblePlace {
  id: number
  name: string
  /** Posición en el mundo (metros): un metro sobre el suelo. */
  position: [number, number, number]
  color: string
}

/** Lugares a dibujar: los de la categoría activa, con su color; vacío mientras no hay datos (RF-28.3). */
export function useVisiblePlaces(): VisiblePlace[] {
  const status = usePlacesStore((s) => s.status)
  const places = usePlacesStore((s) => s.places)
  const categories = usePlacesStore((s) => s.categories)
  const activeCategory = useMapStore((s) => s.activeCategory)

  return useMemo(() => {
    if (status !== 'ready') return []
    const colorByCategory = new Map(categories.map((c) => [c.id, c.color]))
    return filterPlaces(places, activeCategory).map((p) => {
      const [x, z] = toLocal(p.coordinates)
      return { id: p.id, name: p.name, position: [x, 1, z], color: colorByCategory.get(p.category) ?? FALLBACK_COLOR }
    })
  }, [status, places, categories, activeCategory])
}
