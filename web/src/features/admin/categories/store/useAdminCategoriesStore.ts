import { create } from 'zustand'
import { useToastStore } from '@/components/Toast/toastStore'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import {
  deleteAdminCategory,
  listAdminCategories,
  saveAdminCategory,
} from '@/services/api/adminPlacesApi'
import type { AdminCategory, AdminCategoryInput } from '../../places/types'

export type AdminStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AdminCategoriesState {
  status: AdminStatus
  categories: AdminCategory[]
  /** Pide las categorías. Con `quiet` no pasa por `loading` (la tabla no parpadea). */
  load: (options?: { quiet?: boolean }) => Promise<void>
  /** `id` nulo crea; con `id` edita. Lanza el error del servidor para que el diálogo lo muestre. */
  save: (id: number | null, input: AdminCategoryInput) => Promise<AdminCategory>
  /** Borra una categoría vacía. Lanza el error del servidor (p. ej. 409). */
  remove: (id: number) => Promise<void>
}

const bySort = (a: AdminCategory, b: AdminCategory) => a.sortOrder - b.sortOrder || a.id - b.id

export const useAdminCategoriesStore = create<AdminCategoriesState>((set, get) => ({
  status: 'idle',
  categories: [],
  load: async ({ quiet = false } = {}) => {
    if (!quiet) set({ status: 'loading' })
    try {
      set({ categories: await listAdminCategories(), status: 'ready' })
    } catch {
      // Un refresco silencioso fallido conserva lo que ya se veía.
      if (!quiet || get().status !== 'ready') set({ status: 'error' })
    }
  },
  save: async (id, input) => {
    const saved = await saveAdminCategory(id, input)
    set((s) => ({
      categories: [...s.categories.filter((c) => c.id !== saved.id), saved].sort(bySort),
    }))
    useToastStore.getState().show('Categoría guardada', 'success')
    void usePlacesStore.getState().refresh()
    return saved
  },
  remove: async (id) => {
    await deleteAdminCategory(id)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
    useToastStore.getState().show('Categoría borrada', 'success')
    void usePlacesStore.getState().refresh()
  },
}))
