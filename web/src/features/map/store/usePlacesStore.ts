import { create } from 'zustand'
import { fetchPlacesAndCategories } from '@/services/api/placesApi'
import type { Place, PlaceCategory } from '../types'

/** Mensaje para el usuario cuando no se pudieron cargar los lugares (RF-28.4, RF-28.5). */
export const PLACES_ERROR_MESSAGE =
  'No pudimos cargar los lugares del campus. Revisa tu conexión e inténtalo de nuevo.'

export type PlacesStatus = 'idle' | 'loading' | 'ready' | 'error'

interface PlacesState {
  status: PlacesStatus
  /** Lugares publicados, en el orden de la API. Vacío hasta `ready`. */
  places: Place[]
  /** Los mismos lugares por id, para resolverlos rápido (RF-28.11). */
  byId: Record<number, Place>
  /** Mismos lugares por slug: el asistente los nombra así (su corpus aún no usa los ids numéricos). */
  bySlug: Record<string, Place>
  /** Categorías de la API, en su orden. */
  categories: PlaceCategory[]
  /**
   * Pide lugares y categorías. No hace nada si ya está cargando o ya cargó
   * (RF-28.1: una sola vez); tras un error vuelve a pedir («Reintentar»).
   */
  load: () => Promise<void>
  /**
   * Vuelve a pedir todo aunque ya esté cargado (HU-31: tras un cambio del administrador). No pasa
   * por `loading` —el mapa no parpadea— y salta la copia del navegador. Si falla, conserva lo que había.
   */
  refresh: () => Promise<void>
  /**
   * Agrega los lugares que aún no se conocen (p. ej. uno creado hace un momento que devolvió la
   * búsqueda del servidor) para que se puedan elegir y verse en el mapa (HU-36, RF-36.17).
   */
  addMissing: (places: Place[]) => void
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  status: 'idle',
  places: [],
  byId: {},
  bySlug: {},
  categories: [],
  load: async () => {
    const { status } = get()
    if (status === 'loading' || status === 'ready') return
    set({ status: 'loading' })
    try {
      const { places, categories } = await fetchPlacesAndCategories()
      set({
        status: 'ready',
        places,
        categories,
        byId: Object.fromEntries(places.map((p) => [p.id, p])),
        bySlug: Object.fromEntries(places.map((p) => [p.slug, p])),
      })
    } catch {
      // El detalle técnico ya lo registró el cliente de red; el usuario ve un mensaje fijo.
      set({ status: 'error', places: [], byId: {}, bySlug: {}, categories: [] })
    }
  },
  addMissing: (incoming) => {
    const known = get().byId
    const fresh = incoming.filter((p) => !known[p.id])
    if (fresh.length === 0) return
    set((s) => ({
      places: [...s.places, ...fresh],
      byId: { ...s.byId, ...Object.fromEntries(fresh.map((p) => [p.id, p])) },
      bySlug: { ...s.bySlug, ...Object.fromEntries(fresh.map((p) => [p.slug, p])) },
    }))
  },
  refresh: async () => {
    try {
      const { places, categories } = await fetchPlacesAndCategories({ fresh: true })
      set({
        status: 'ready',
        places,
        categories,
        byId: Object.fromEntries(places.map((p) => [p.id, p])),
        bySlug: Object.fromEntries(places.map((p) => [p.slug, p])),
      })
    } catch {
      // Se queda con los datos anteriores: un refresco fallido no debe vaciar el mapa.
    }
  },
}))

/** Categorías con al menos un lugar publicado, en el orden de la API (RF-28.8). */
export function selectVisibleCategories(state: Pick<PlacesState, 'places' | 'categories'>): PlaceCategory[] {
  const used = new Set(state.places.map((p) => p.category))
  return state.categories.filter((c) => used.has(c.id))
}
