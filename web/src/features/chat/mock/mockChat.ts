import { PLACES } from '@/features/map/data/places'
import { normalizeText } from '@/features/map/utils/search'
import type { ChatResponse, LocationResult } from '../types'

/** Latencia simulada para que se vea el indicador «escribiendo…». */
export const MOCK_DELAY_MS = 700

/** Texto en minúsculas, sin tildes y con las palabras separadas por un espacio. */
function words(text: string): string {
  return normalizeText(text).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

/** Respuesta de demostración: busca por nombre o palabra clave (palabras completas). */
export function buildMockResponse(query: string): ChatResponse {
  const haystack = ` ${words(query)} `
  const matches = PLACES.filter((place) =>
    [place.name, ...place.keywords].some((term) => {
      const t = words(term)
      return t !== '' && haystack.includes(` ${t} `)
    }),
  )

  if (matches.length === 0) {
    return {
      answer:
        'No encontré un lugar para tu consulta. Prueba mencionando sitios como la Biblioteca Central ' +
        'o una facultad. (Respuesta de demostración: el asistente no está conectado al backend.)',
      locations: [],
      drawRoute: false,
      destination: null,
    }
  }

  const locations: LocationResult[] = matches.map((place) => ({
    id: place.id,
    name: place.name,
    schedule: place.schedule,
  }))
  const answer =
    matches.length === 1
      ? `Claro, te ubico ${matches[0].name}. Toca "Ver en el mapa" para verlo.`
      : `Encontré ${matches.length} lugares relacionados con tu consulta. Toca "Ver en el mapa" en cualquiera para verlo.`

  return { answer, locations, drawRoute: false, destination: null }
}

export function mockChatQuery(query: string): Promise<ChatResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildMockResponse(query)), MOCK_DELAY_MS)
  })
}
