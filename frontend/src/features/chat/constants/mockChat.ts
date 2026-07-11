import { CAMPUS_PLACES } from '@features/map/constants/unmsm';
import type { ChatResponse, LocationResult } from '../types';

/** Latencia simulada del asistente para que se vea el indicador de carga. */
const MOCK_DELAY_MS = 700;

/** Marcas diacríticas combinables (U+0300–U+036F) para quitar tildes. */
const DIACRITICS = /[̀-ͯ]/g;

/** Normaliza texto: minúsculas y sin tildes, para emparejar consultas. */
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(DIACRITICS, '');
}

/**
 * Construye una respuesta del asistente a partir de palabras clave.
 * Empareja la consulta contra los lugares del campus (`CAMPUS_PLACES`).
 */
export function buildMockResponse(query: string): ChatResponse {
  const normalizedQuery = normalize(query);

  const matches = CAMPUS_PLACES.filter((place) =>
    place.keywords.some((keyword) => normalizedQuery.includes(normalize(keyword)))
  );

  if (matches.length === 0) {
    return {
      answer:
        'No encontré un lugar exacto para tu consulta. Prueba mencionando ' +
        'sitios como el Rectorado, el Comedor Universitario o la Biblioteca ' +
        'Central. (Respuesta de demostración — el asistente aún no está ' +
        'conectado al backend).',
      locations: [],
    };
  }

  const locations: LocationResult[] = matches.map((place) => ({
    id: place.id,
    name: place.name,
    schedule: place.schedule,
    entranceCoordinate: place.entranceCoordinate,
  }));

  const answer =
    matches.length === 1
      ? `Claro, te ubico ${matches[0].name}. Su horario de atención es ` +
        `${matches[0].schedule}. Toca "Ver en mapa" para verlo.`
      : `Encontré ${matches.length} lugares relacionados con tu consulta. ` +
        'Toca "Ver en mapa" en cualquiera para verlo.';

  return { answer, locations };
}

/**
 * Simula la llamada al asistente con una pequeña latencia.
 * Se usa como modo mock y como fallback cuando el backend falla.
 */
export function mockChatQuery(query: string): Promise<ChatResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildMockResponse(query)), MOCK_DELAY_MS);
  });
}
