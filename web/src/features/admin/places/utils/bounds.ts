import { CAMPUS_MAX_BOUNDS } from '@/features/map/constants/campus'

/**
 * Área en la que se aceptan coordenadas de un lugar (RF-31.24): el área que el mapa deja ver. Debe
 * coincidir con `backend/app/places/area.py`, que es la que decide al guardar.
 */
const [[minLng, minLat], [maxLng, maxLat]] = CAMPUS_MAX_BOUNDS
export const PLACE_AREA = { minLat, maxLat, minLng, maxLng } as const

export function inPlaceArea(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PLACE_AREA.minLat &&
    lat <= PLACE_AREA.maxLat &&
    lng >= PLACE_AREA.minLng &&
    lng <= PLACE_AREA.maxLng
  )
}
