/** Lugar del campus que el asistente nombra en una respuesta. */
export interface LocationResult {
  id: string
  name: string
  schedule?: string
}

export interface Coordinate {
  latitude: number
  longitude: number
}

/** Respuesta del asistente, ya normalizada a camelCase. */
export interface ChatResponse {
  answer: string
  locations: LocationResult[]
  /** El backend pide trazar una ruta hacia `destination` (HU-13/14). */
  drawRoute: boolean
  destination: Coordinate | null
}
