import { Config } from '@/config'
import { mockChatQuery } from '@/features/chat/mock/mockChat'
import type { ChatResponse, Coordinate } from '@/features/chat/types'
import { ApiError, apiClient } from './client'

/** Forma cruda del backend (snake_case). */
interface ChatApiResponse {
  answer?: unknown
  locations?: { id: string; name: string; schedule?: string | null }[] | null
  draw_route?: boolean | null
  destination?: Coordinate | null
}

/** Envía una consulta al asistente: `POST /api/chat` con `{ query }`. */
export async function sendChatQuery(query: string): Promise<ChatResponse> {
  if (Config.api.useMockChat) return mockChatQuery(query)

  const raw = await apiClient.post<ChatApiResponse>('/api/chat', { query })
  if (typeof raw?.answer !== 'string') {
    throw new ApiError('invalid', 'POST /api/chat: la respuesta no trae "answer" como texto')
  }
  return {
    answer: raw.answer,
    locations: (raw.locations ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      schedule: l.schedule ?? undefined,
    })),
    drawRoute: raw.draw_route ?? false,
    destination: raw.destination ?? null,
  }
}
