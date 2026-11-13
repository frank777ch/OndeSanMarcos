import { create } from 'zustand'
import { ApiError } from '@/services/api/client'
import { sendChatQuery } from '@/services/api/chatApi'
import type { LocationResult } from '../types'
import { normalizeQuery } from '../utils/query'

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; places: LocationResult[] }

export type ChatStatus = 'idle' | 'sending' | 'error'

interface ChatState {
  messages: ChatMessage[]
  status: ChatStatus
  /** Mensaje legible del último fallo; solo tiene valor con `status === 'error'`. */
  error: string | null
  /** Última pregunta enviada, para «Reintentar». */
  lastQuery: string | null
  /** Envía la pregunta. No hace nada si está vacía o ya hay una consulta en curso. */
  send: (text: string) => Promise<void>
  /** Repite la última pregunta tras un error, sin duplicar el mensaje del usuario. */
  retry: () => Promise<void>
}

const GENERIC_ERROR = 'El asistente tuvo un problema. Inténtalo de nuevo.'

let nextId = 0
const newId = () => `m${++nextId}`
/** Identifica la consulta vigente: una respuesta de una consulta anterior se descarta. */
let currentRequest = 0

export const useChatStore = create<ChatState>((set, get) => {
  async function run(query: string) {
    const request = ++currentRequest
    try {
      const response = await sendChatQuery(query)
      if (request !== currentRequest) return
      const message: ChatMessage = {
        id: newId(),
        role: 'assistant',
        text: response.answer,
        // Se guardan todos; `AssistantMessage` omite al mostrar los que el mapa no conoce (RF-05.18, RF-28.14).
        places: response.locations,
      }
      set((s) => ({ messages: [...s.messages, message], status: 'idle', error: null }))
    } catch (error) {
      if (request !== currentRequest) return
      set({ status: 'error', error: error instanceof ApiError ? error.message : GENERIC_ERROR })
    }
  }

  return {
    messages: [],
    status: 'idle',
    error: null,
    lastQuery: null,
    send: async (text) => {
      const query = normalizeQuery(text)
      if (!query || get().status === 'sending') return
      set((s) => ({
        messages: [...s.messages, { id: newId(), role: 'user', text: query }],
        status: 'sending',
        error: null,
        lastQuery: query,
      }))
      await run(query)
    },
    retry: async () => {
      const { status, lastQuery } = get()
      if (status !== 'error' || !lastQuery) return
      set({ status: 'sending', error: null })
      await run(lastQuery)
    },
  }
})
