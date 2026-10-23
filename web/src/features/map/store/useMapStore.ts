import { create } from 'zustand'
import { PLACES, type PlaceCategoryId } from '../data/places'

interface MapState {
  /** Categoría filtrada, o `null` si se ven todos los lugares. */
  activeCategory: PlaceCategoryId | null
  /** Lugar elegido (al que vuela la cámara), o `null`. */
  selectedPlaceId: string | null
  /** Activa la categoría; si ya estaba activa, la desactiva. */
  toggleCategory: (id: PlaceCategoryId) => void
  /**
   * Elige un lugar. Si un filtro de otra categoría lo ocultaría, quita el filtro.
   * Un id desconocido se ignora.
   */
  selectPlace: (id: string) => void
  clearSelection: () => void
}

export const useMapStore = create<MapState>((set) => ({
  activeCategory: null,
  selectedPlaceId: null,
  toggleCategory: (id) =>
    set((s) => ({ activeCategory: s.activeCategory === id ? null : id })),
  selectPlace: (id) =>
    set((s) => {
      const place = PLACES.find((p) => p.id === id)
      if (!place) return s
      const hidden = s.activeCategory !== null && s.activeCategory !== place.category
      return {
        selectedPlaceId: id,
        activeCategory: hidden ? null : s.activeCategory,
      }
    }),
  clearSelection: () => set({ selectedPlaceId: null }),
}))
