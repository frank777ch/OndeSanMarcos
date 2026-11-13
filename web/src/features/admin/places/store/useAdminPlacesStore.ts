import { create } from 'zustand'
import { useToastStore } from '@/components/Toast/toastStore'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import {
  listAdminPlaces,
  reindexAdminPlace,
  saveAdminPlace,
  toInput,
} from '@/services/api/adminPlacesApi'
import { useAdminCategoriesStore, type AdminStatus } from '../../categories/store/useAdminCategoriesStore'
import type { AdminPlace, AdminPlaceInput, SavedPlace } from '../types'
import { EMPTY_FILTERS, type PlaceFilters } from '../utils/filters'

interface AdminPlacesState {
  status: AdminStatus
  places: AdminPlace[]
  filters: PlaceFilters
  /** Página actual (desde 1); la tabla la corrige si se pasa del final. */
  page: number
  /** Lugares con una acción de fila en curso (RF-31.10). */
  busy: Record<number, true>
  /** Lugar guardado cuyo asistente no se actualizó (RF-31.20). */
  ragWarning: { placeId: number; name: string } | null
  load: (options?: { quiet?: boolean }) => Promise<void>
  setFilters: (changes: Partial<PlaceFilters>) => void
  resetFilters: () => void
  setPage: (page: number) => void
  /** `id` nulo crea; con `id` reemplaza. Lanza el error del servidor para que el diálogo lo muestre. */
  save: (id: number | null, input: AdminPlaceInput) => Promise<SavedPlace>
  togglePublished: (place: AdminPlace) => Promise<boolean>
  toggleVerified: (place: AdminPlace) => Promise<boolean>
  retryReindex: () => Promise<void>
  dismissRagWarning: () => void
}

const byName = (a: AdminPlace, b: AdminPlace) => a.name.localeCompare(b.name, 'es') || a.id - b.id
const toast = (message: string, kind: 'success' | 'error' = 'success') =>
  useToastStore.getState().show(message, kind)

export const useAdminPlacesStore = create<AdminPlacesState>((set, get) => {
  /** Guarda el lugar devuelto por el servidor y avisa al resto de la web. */
  const apply = ({ place, ragSync }: SavedPlace) => {
    set((s) => ({
      places: [...s.places.filter((p) => p.id !== place.id), place].sort(byName),
      ragWarning:
        ragSync === 'failed'
          ? { placeId: place.id, name: place.name }
          : s.ragWarning?.placeId === place.id
            ? null
            : s.ragWarning,
    }))
    // El mapa público y las cuentas de las categorías se actualizan sin recargar (RF-31.33).
    void usePlacesStore.getState().refresh()
    void useAdminCategoriesStore.getState().load({ quiet: true })
  }

  const rowAction = async (place: AdminPlace, changes: Partial<AdminPlaceInput>, done: string) => {
    if (get().busy[place.id]) return false
    set((s) => ({ busy: { ...s.busy, [place.id]: true } }))
    try {
      apply(await saveAdminPlace(place.id, toInput(place, changes)))
      toast(done)
      return true
    } catch {
      // La fila no cambió: la tabla sigue mostrando lo que el servidor tiene.
      toast('No se pudo guardar el cambio. Inténtalo de nuevo.', 'error')
      return false
    } finally {
      set((s) => {
        const { [place.id]: _removed, ...rest } = s.busy
        return { busy: rest }
      })
    }
  }

  return {
    status: 'idle',
    places: [],
    filters: EMPTY_FILTERS,
    page: 1,
    busy: {},
    ragWarning: null,
    load: async ({ quiet = false } = {}) => {
      if (!quiet) set({ status: 'loading' })
      try {
        set({ places: (await listAdminPlaces()).sort(byName), status: 'ready' })
      } catch {
        if (!quiet || get().status !== 'ready') set({ status: 'error' })
      }
    },
    setFilters: (changes) => set((s) => ({ filters: { ...s.filters, ...changes }, page: 1 })),
    resetFilters: () => set({ filters: EMPTY_FILTERS, page: 1 }),
    setPage: (page) => set({ page }),
    save: async (id, input) => {
      const saved = await saveAdminPlace(id, input)
      apply(saved)
      toast('Lugar guardado')
      return saved
    },
    togglePublished: (place) =>
      rowAction(
        place,
        { isPublished: !place.isPublished },
        place.isPublished ? 'Lugar despublicado' : 'Lugar publicado',
      ),
    toggleVerified: (place) => {
      const verified = place.verifiedAt === null
      return rowAction(place, { verified }, verified ? 'Lugar verificado' : 'Verificación quitada')
    },
    retryReindex: async () => {
      const warning = get().ragWarning
      if (!warning) return
      try {
        const saved = await reindexAdminPlace(warning.placeId)
        if (saved.ragSync === 'failed') {
          toast('El asistente todavía no pudo actualizarse. Inténtalo de nuevo.', 'error')
          return
        }
        set({ ragWarning: null })
        toast('El asistente ya conoce el lugar')
      } catch {
        toast('No se pudo contactar con el servidor. Inténtalo de nuevo.', 'error')
      }
    },
    dismissRagWarning: () => set({ ragWarning: null }),
  }
})
