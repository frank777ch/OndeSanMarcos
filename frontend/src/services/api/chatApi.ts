import { apiClient } from './client';
import type { ChatResponse, Coordinate, LocationResult } from '@features/chat/types';

/** Forma cruda del backend (snake_case). */
interface ChatApiResponse {
  answer: string;
  locations: LocationResult[];
  draw_route?: boolean;
  destination?: Coordinate | null;
}

/**
 * Envía una consulta al asistente IA del campus.
 * POST `${EXPO_PUBLIC_API_URL}/api/chat` con body `{ query }`.
 * Normaliza la respuesta del backend al contrato camelCase del frontend.
 */
export async function sendChatQuery(query: string): Promise<ChatResponse> {
  const raw = await apiClient.post<ChatApiResponse>('/api/chat', { query });
  return {
    answer: raw.answer,
    locations: raw.locations ?? [],
    drawRoute: raw.draw_route ?? false,
    destination: raw.destination ?? null,
  };
}
