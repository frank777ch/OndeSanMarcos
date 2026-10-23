import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from '@/config'
import { ApiError, apiClient, userMessageFor } from './client'

vi.mock('@/config', () => ({
  Config: {
    api: { baseUrl: 'http://api.test', timeoutMs: 30_000, useMockChat: false },
    dev: { enableLogs: false },
  },
}))

const config = Config as unknown as { dev: { enableLogs: boolean } }

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, ...init })
}

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    return error as ApiError
  }
  throw new Error('se esperaba un error')
}

describe('apiClient.post', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    config.dev.enableLogs = false
  })
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('RF-04.6: envía el cuerpo como JSON con Content-Type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await apiClient.post('/api/chat', { query: 'hola' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/api/chat')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(init.body).toBe(JSON.stringify({ query: 'hola' }))
  })

  it('RF-04.7: devuelve el JSON de una respuesta 2xx', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ answer: 'x' }))
    expect(await apiClient.post('/api/chat', {})).toEqual({ answer: 'x' })
  })

  it('RF-04.8: cancela a los 30 s y falla con tipo timeout', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          )
        }),
    )
    const pending = failure(apiClient.post('/api/chat', {}))
    await vi.advanceTimersByTimeAsync(29_999)
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    const error = await pending
    expect(error).toBeInstanceOf(ApiError)
    expect(error.kind).toBe('timeout')
  })

  it('RF-04.9: sin conexión falla con tipo network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect((await failure(apiClient.post('/api/chat', {}))).kind).toBe('network')
  })

  it('RF-04.10: un estado no 2xx falla con tipo http y conserva el estado', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }))
    const error = await failure(apiClient.post('/api/chat', {}))
    expect(error.kind).toBe('http')
    expect(error.status).toBe(500)
  })

  it('RF-04.11: un cuerpo que no es JSON falla con tipo invalid', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }))
    expect((await failure(apiClient.post('/api/chat', {}))).kind).toBe('invalid')
  })

  it('RF-04.13: no deja temporizadores activos al terminar', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(jsonResponse({}))
    await apiClient.post('/api/chat', {})
    expect(vi.getTimerCount()).toBe(0)
    fetchMock.mockResolvedValue(new Response('', { status: 500 }))
    await failure(apiClient.post('/api/chat', {}))
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('mensajes de error', () => {
  it('RF-04.12: textos en español por tipo y estado', () => {
    expect(userMessageFor('network')).toBe(
      'No pudimos conectarnos con el asistente. Revisa tu conexión e inténtalo de nuevo.',
    )
    expect(userMessageFor('timeout')).toBe('El asistente tardó demasiado en responder. Inténtalo de nuevo.')
    expect(userMessageFor('http', 503)).toBe('El asistente no está disponible por ahora. Inténtalo en unos minutos.')
    expect(userMessageFor('http', 422)).toBe('Tu pregunta no es válida. Escríbela con entre 1 y 1000 caracteres.')
    expect(userMessageFor('http', 500)).toBe('El asistente tuvo un problema. Inténtalo de nuevo.')
    expect(userMessageFor('http', 404)).toBe('El asistente tuvo un problema. Inténtalo de nuevo.')
    expect(userMessageFor('invalid')).toBe('El asistente tuvo un problema. Inténtalo de nuevo.')
  })

  it('RF-04.12 y RF-04.24: el mensaje no trae estado ni dirección; el detalle sí', () => {
    const error = new ApiError('http', 'POST http://api.test/api/chat: 503 Service Unavailable', 503)
    expect(error.message).not.toMatch(/503|http|api\.test/i)
    expect(error.detail).toContain('503')
    expect(error.detail).toContain('http://api.test/api/chat')
  })
})

describe('logs de red', () => {
  const fetchMock = vi.fn()

  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    config.dev.enableLogs = false
  })

  it('RF-04.23: con logs activos escribe método, dirección, estado y duración', async () => {
    config.dev.enableLogs = true
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    fetchMock.mockResolvedValue(jsonResponse({}))
    await apiClient.post('/api/chat', {})
    expect(log).toHaveBeenCalledWith('[api]', 'POST', 'http://api.test/api/chat', 200, expect.stringMatching(/^\d+ms$/))
  })

  it('RF-04.24: con logs activos, el detalle técnico del fallo va a la consola', async () => {
    config.dev.enableLogs = true
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fetchMock.mockResolvedValue(new Response('', { status: 503, statusText: 'Service Unavailable' }))
    await failure(apiClient.post('/api/chat', {}))
    expect(warn).toHaveBeenCalledWith('[api]', 'http', expect.stringContaining('503'))
  })

  it('RF-04.23: con logs apagados no escribe nada', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fetchMock.mockResolvedValueOnce(jsonResponse({}))
    await apiClient.post('/api/chat', {})
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    await failure(apiClient.post('/api/chat', {}))
    expect(log).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })
})
