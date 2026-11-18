import { create } from 'zustand'
import type { PlaceCategoryId } from '../types'
import { groupByPlace, selectUpcoming, useEventsStore } from '@/features/events/store/useEventsStore'
import { usePlacesStore } from './usePlacesStore'

/** Quién eligió el lugar: un toque en el mapa u otra fuente (buscador, chat…). */
export type SelectionOrigin = 'map' | 'other'

interface MapState {
  /** Categoría filtrada, o `null` si se ven todos los lugares. */
  activeCategory: PlaceCategoryId | null
  /** Modo «Eventos»: solo se ven los lugares con eventos próximos. Excluyente con la categoría. */
  eventsMode: boolean
  /** Activa o desactiva el modo eventos; al activarlo quita la categoría. */
  toggleEventsMode: () => void
  /** Lugar elegido (su ficha está abierta), o `null`. */
  selectedPlaceId: number | null
  /** De dónde vino la selección. Un toque en el mapa no mueve la cámara. */
  selectionOrigin: SelectionOrigin | null
  /**
   * Activa la categoría; si ya estaba activa, la desactiva. Si el nuevo filtro
   * oculta el lugar elegido, también limpia la selección.
   */
  toggleCategory: (id: PlaceCategoryId) => void
  /** Quita el filtro de categoría («Todos»). */
  clearCategory: () => void
  /**
   * Elige un lugar. Si un filtro de otra categoría lo ocultaría, quita el filtro.
   * Un id desconocido se ignora.
   */
  selectPlace: (id: number, origin?: SelectionOrigin) => void
  clearSelection: () => void
}

export const useMapStore = create<MapState>((set) => ({
  activeCategory: null,
  eventsMode: false,
  selectedPlaceId: null,
  selectionOrigin: null,
  toggleEventsMode: () =>
    set((s) => {
      if (s.eventsMode) return { eventsMode: false }
      const withEvents = groupByPlace(selectUpcoming(useEventsStore.getState().events))
      const hidden = s.selectedPlaceId !== null && !withEvents.has(s.selectedPlaceId)
      return hidden
        ? { eventsMode: true, activeCategory: null, selectedPlaceId: null, selectionOrigin: null }
        : { eventsMode: true, activeCategory: null }
    }),
  toggleCategory: (id) =>
    set((s) => {
      const next = s.activeCategory === id ? null : id
      const selected = s.selectedPlaceId ? usePlacesStore.getState().byId[s.selectedPlaceId] : undefined
      const hidden = next !== null && selected !== undefined && selected.category !== next
      return hidden
        ? { activeCategory: next, eventsMode: false, selectedPlaceId: null, selectionOrigin: null }
        : { activeCategory: next, eventsMode: false }
    }),
  clearCategory: () => set({ activeCategory: null, eventsMode: false }),
  selectPlace: (id, origin = 'other') =>
    set((s) => {
      const place = usePlacesStore.getState().byId[id]
      if (!place) return s
      const hidden = s.activeCategory !== null && s.activeCategory !== place.category
      const noEvents = s.eventsMode && !groupByPlace(selectUpcoming(useEventsStore.getState().events)).has(id)
      return {
        selectedPlaceId: id,
        selectionOrigin: origin,
        activeCategory: hidden ? null : s.activeCategory,
        eventsMode: noEvents ? false : s.eventsMode,
      }
    }),
  clearSelection: () => set({ selectedPlaceId: null, selectionOrigin: null }),
}))
