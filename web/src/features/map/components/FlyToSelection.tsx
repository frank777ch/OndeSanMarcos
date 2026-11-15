import { useEffect } from 'react'
import { useCameraStore } from '../scene/cameraStore'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'

const SELECTED_ZOOM = 18

/** Lleva la cámara al lugar elegido (RF-40.10). */
export function FlyToSelection() {
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)

  useEffect(() => {
    if (!selectedPlaceId) return
    // Un toque en el mapa no mueve la cámara: el lugar ya está a la vista.
    if (useMapStore.getState().selectionOrigin === 'map') return
    const place = usePlacesStore.getState().byId[selectedPlaceId]
    if (!place) return
    useCameraStore.getState().flyTo(place.coordinates, { zoom: SELECTED_ZOOM })
  }, [selectedPlaceId])

  return null
}
