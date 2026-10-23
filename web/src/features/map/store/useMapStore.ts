import { create } from 'zustand'
import type { PlaceCategoryId } from '../data/places'

interface MapState {
  /** Categoría filtrada, o `null` si se ven todos los lugares. */
  activeCategory: PlaceCategoryId | null
  /** Activa la categoría; si ya estaba activa, la desactiva. */
  toggleCategory: (id: PlaceCategoryId) => void
}

export const useMapStore = create<MapState>((set) => ({
  activeCategory: null,
  toggleCategory: (id) =>
    set((s) => ({ activeCategory: s.activeCategory === id ? null : id })),
}))
