import { apiClient } from './client';
import type { ChatResponse } from '@features/chat/types';

/**
 * Envía una consulta al asistente IA del campus.
 * POST `${EXPO_PUBLIC_API_URL}/api/chat` con body `{ query }`.
 */
export function sendChatQuery(query: string): Promise<ChatResponse> {
  return apiClient.post<ChatResponse>('/api/chat', { query });
}
