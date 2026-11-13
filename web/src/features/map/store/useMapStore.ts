import { create } from 'zustand'
import type { PlaceCategoryId } from '../types'
import { usePlacesStore } from './usePlacesStore'

/** Quién eligió el lugar: un toque en el mapa u otra fuente (buscador, chat…). */
export type SelectionOrigin = 'map' | 'other'

interface MapState {
  /** Categoría filtrada, o `null` si se ven todos los lugares. */
  activeCategory: PlaceCategoryId | null
  /** Lugar elegido (su ficha está abierta), o `null`. */
  selectedPlaceId: string | null
  /** De dónde vino la selección. Un toque en el mapa no mueve la cámara. */
  selectionOrigin: SelectionOrigin | null
  /**
   * Activa la categoría; si ya estaba activa, la desactiva. Si el nuevo filtro
   * oculta el lugar elegido, también limpia la selección.
   */
  toggleCategory: (id: PlaceCategoryId) => void
  /**
   * Elige un lugar. Si un filtro de otra categoría lo ocultaría, quita el filtro.
   * Un id desconocido se ignora.
   */
  selectPlace: (id: string, origin?: SelectionOrigin) => void
  clearSelection: () => void
}

export const useMapStore = create<MapState>((set) => ({
  activeCategory: null,
  selectedPlaceId: null,
  selectionOrigin: null,
  toggleCategory: (id) =>
    set((s) => {
      const next = s.activeCategory === id ? null : id
      const selected = s.selectedPlaceId ? usePlacesStore.getState().byId[s.selectedPlaceId] : undefined
      const hidden = next !== null && selected !== undefined && selected.category !== next
      return hidden
        ? { activeCategory: next, selectedPlaceId: null, selectionOrigin: null }
        : { activeCategory: next }
    }),
  selectPlace: (id, origin = 'other') =>
    set((s) => {
      const place = usePlacesStore.getState().byId[id]
      if (!place) return s
      const hidden = s.activeCategory !== null && s.activeCategory !== place.category
      return {
        selectedPlaceId: id,
        selectionOrigin: origin,
        activeCategory: hidden ? null : s.activeCategory,
      }
    }),
  clearSelection: () => set({ selectedPlaceId: null, selectionOrigin: null }),
}))
