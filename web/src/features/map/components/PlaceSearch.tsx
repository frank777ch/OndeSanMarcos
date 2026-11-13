import { useRef, useState } from 'react'
import type { Place } from '../types'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'
import { PlaceCombobox } from './PlaceCombobox'

/** Buscador del mapa: elegir un resultado selecciona el lugar (y abre su ficha). */
export function PlaceSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const clearSelection = useMapStore((s) => s.clearSelection)
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)
  const status = usePlacesStore((s) => s.status)
  const byId = usePlacesStore((s) => s.byId)

  // Si el mapa se abre con un lugar ya elegido (desde el chat), el campo ya lo muestra.
  const [query, setQuery] = useState(() => (selectedPlaceId ? byId[selectedPlaceId]?.name : undefined) ?? '')

  // El campo sigue a la selección: muestra el nombre del lugar elegido (también
  // al tocar un punto del mapa) y se vacía cuando la ficha se cierra.
  const [syncedId, setSyncedId] = useState(selectedPlaceId)
  if (syncedId !== selectedPlaceId) {
    setSyncedId(selectedPlaceId)
    setQuery((selectedPlaceId ? byId[selectedPlaceId]?.name : undefined) ?? '')
  }

  const choose = (place: Place) => {
    selectPlace(place.id)
    setQuery(place.name)
  }

  const clear = () => {
    setQuery('')
    clearSelection()
    inputRef.current?.focus()
  }

  return (
    <PlaceCombobox
      label="Buscar un lugar"
      value={query}
      onValueChange={setQuery}
      onChoose={choose}
      onClear={clear}
      inputRef={inputRef}
      // Hasta que carguen los lugares no hay nada que buscar (RF-28.3).
      disabled={status !== 'ready'}
    />
  )
}
