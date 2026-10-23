import { act } from '@testing-library/react'
import { ApiError } from '@/services/api/client'
import type { ChatResponse } from '../types'
import { useChatStore } from './useChatStore'

const sendChatQuery = vi.fn()
vi.mock('@/services/api/chatApi', () => ({ sendChatQuery: (q: string) => sendChatQuery(q) }))

const reply = (over: Partial<ChatResponse> = {}): ChatResponse => ({
  answer: 'respuesta',
  locations: [],
  drawRoute: false,
  destination: null,
  ...over,
})

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useChatStore', () => {
  beforeEach(() => {
    sendChatQuery.mockReset()
    useChatStore.setState({ messages: [], status: 'idle', error: null, lastQuery: null })
  })

  it('RF-05.1 y RF-05.5: añade la pregunta y luego la respuesta, en orden', async () => {
    sendChatQuery.mockResolvedValue(reply({ answer: 'Está en la Av. Amézaga' }))
    await act(() => useChatStore.getState().send('  ¿Dónde está la cepre? '))
    const { messages, status } = useChatStore.getState()
    expect(sendChatQuery).toHaveBeenCalledWith('¿Dónde está la cepre?')
    expect(messages).toMatchObject([
      { role: 'user', text: '¿Dónde está la cepre?' },
      { role: 'assistant', text: 'Está en la Av. Amézaga', places: [] },
    ])
    expect(status).toBe('idle')
  })

  it('RF-05.1: mientras espera, el mensaje del usuario ya está y el estado es sending', async () => {
    const d = deferred<ChatResponse>()
    sendChatQuery.mockReturnValue(d.promise)
    let pending!: Promise<void>
    act(() => {
      pending = useChatStore.getState().send('hola')
    })
    expect(useChatStore.getState().status).toBe('sending')
    expect(useChatStore.getState().messages).toHaveLength(1)
    await act(async () => {
      d.resolve(reply())
      await pending
    })
  })

  it('RF-05.3: una pregunta vacía no llama al cliente', async () => {
    await act(() => useChatStore.getState().send('   '))
    expect(sendChatQuery).not.toHaveBeenCalled()
    expect(useChatStore.getState().messages).toEqual([])
  })

  it('RF-05.4: con una consulta en curso no se envía otra', async () => {
    const d = deferred<ChatResponse>()
    sendChatQuery.mockReturnValue(d.promise)
    let first!: Promise<void>
    act(() => {
      first = useChatStore.getState().send('uno')
    })
    await act(() => useChatStore.getState().send('dos'))
    expect(sendChatQuery).toHaveBeenCalledTimes(1)
    expect(useChatStore.getState().messages).toHaveLength(1)
    await act(async () => {
      d.resolve(reply())
      await first
    })
  })

  it('RF-05.10: un fallo deja el mensaje legible del error', async () => {
    sendChatQuery.mockRejectedValue(new ApiError('network', 'POST http://x: fetch failed'))
    await act(() => useChatStore.getState().send('hola'))
    const { status, error, messages } = useChatStore.getState()
    expect(status).toBe('error')
    expect(error).toBe(
      'No pudimos conectarnos con el asistente. Revisa tu conexión e inténtalo de nuevo.',
    )
    expect(messages).toHaveLength(1)
  })

  it('RF-05.10: un error inesperado muestra el mensaje genérico, no el técnico', async () => {
    sendChatQuery.mockRejectedValue(new TypeError('x is not a function'))
    await act(() => useChatStore.getState().send('hola'))
    expect(useChatStore.getState().error).toBe('El asistente tuvo un problema. Inténtalo de nuevo.')
  })

  it('RF-05.11: reintentar repite la pregunta sin duplicar el mensaje del usuario', async () => {
    sendChatQuery.mockRejectedValueOnce(new ApiError('timeout', 'x'))
    await act(() => useChatStore.getState().send('hola'))
    sendChatQuery.mockResolvedValueOnce(reply({ answer: 'ya' }))
    await act(() => useChatStore.getState().retry())
    expect(sendChatQuery).toHaveBeenCalledTimes(2)
    expect(sendChatQuery).toHaveBeenLastCalledWith('hola')
    const { messages, status, error } = useChatStore.getState()
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(status).toBe('idle')
    expect(error).toBeNull()
  })

  it('RF-05.11: sin error, reintentar no hace nada', async () => {
    await act(() => useChatStore.getState().retry())
    expect(sendChatQuery).not.toHaveBeenCalled()
  })

  it('RF-05.10: tras un error se puede enviar otra pregunta', async () => {
    sendChatQuery.mockRejectedValueOnce(new ApiError('timeout', 'x'))
    await act(() => useChatStore.getState().send('uno'))
    sendChatQuery.mockResolvedValueOnce(reply())
    await act(() => useChatStore.getState().send('dos'))
    expect(useChatStore.getState().messages.map((m) => m.role)).toEqual(['user', 'user', 'assistant'])
  })

  it('RF-05.18: descarta los lugares que el mapa no conoce y conserva el orden', async () => {
    sendChatQuery.mockResolvedValue(
      reply({
        locations: [
          { id: 'biblioteca-central', name: 'Biblioteca Central Pedro Zulen' },
          { id: 'no-existe', name: 'Fantasma' },
          { id: '8', name: 'FISI' },
        ],
      }),
    )
    await act(() => useChatStore.getState().send('lugares'))
    const last = useChatStore.getState().messages.at(-1)
    expect(last?.role === 'assistant' && last.places.map((p) => p.id)).toEqual(['biblioteca-central', '8'])
  })

  it('RF-05.23: la conversación vive en el store y no depende de la pantalla', async () => {
    sendChatQuery.mockResolvedValue(reply())
    await act(() => useChatStore.getState().send('hola'))
    expect(useChatStore.getState().messages).toHaveLength(2)
  })
})
