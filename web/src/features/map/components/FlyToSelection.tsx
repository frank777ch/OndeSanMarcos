import { useEffect } from 'react'
import { useMap } from 'react-map-gl/mapbox'
import { PLACES } from '../data/places'
import { useMapStore } from '../store/useMapStore'

const SELECTED_ZOOM = 18

/** Lleva la cámara al lugar elegido. Se monta dentro de `<Map>`. */
export function FlyToSelection() {
  const { current: map } = useMap()
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)

  useEffect(() => {
    if (!map || !selectedPlaceId) return
    // Un toque en el mapa no mueve la cámara: el lugar ya está a la vista.
    if (useMapStore.getState().selectionOrigin === 'map') return
    const place = PLACES.find((p) => p.id === selectedPlaceId)
    if (!place) return
    map.flyTo({ center: place.coordinates, zoom: SELECTED_ZOOM, duration: 1500 })
  }, [map, selectedPlaceId])

  return null
}
