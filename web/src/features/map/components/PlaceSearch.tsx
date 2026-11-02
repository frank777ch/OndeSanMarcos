import { useRef, useState } from 'react'
import { PLACES, type Place } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import { PlaceCombobox } from './PlaceCombobox'

/** Buscador del mapa: elegir un resultado selecciona el lugar (y abre su ficha). */
export function PlaceSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const clearSelection = useMapStore((s) => s.clearSelection)
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)

  // Si el mapa se abre con un lugar ya elegido (desde el chat), el campo ya lo muestra.
  const [query, setQuery] = useState(() => PLACES.find((p) => p.id === selectedPlaceId)?.name ?? '')

  // El campo sigue a la selección: muestra el nombre del lugar elegido (también
  // al tocar un punto del mapa) y se vacía cuando la ficha se cierra.
  const [syncedId, setSyncedId] = useState(selectedPlaceId)
  if (syncedId !== selectedPlaceId) {
    setSyncedId(selectedPlaceId)
    setQuery(PLACES.find((p) => p.id === selectedPlaceId)?.name ?? '')
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
    />
  )
}
