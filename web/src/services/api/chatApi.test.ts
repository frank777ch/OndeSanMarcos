import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from '@/config'
import { ApiError } from './client'
import { sendChatQuery } from './chatApi'

vi.mock('@/config', () => ({
  Config: {
    api: { baseUrl: 'http://api.test', timeoutMs: 30_000, useMockChat: false },
    dev: { enableLogs: false },
  },
}))

const config = Config as unknown as { api: { useMockChat: boolean } }
const fetchMock = vi.fn()

function backend(body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
}

describe('sendChatQuery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    config.api.useMockChat = false
  })
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('RF-04.14: hace POST a /api/chat con { query }', async () => {
    backend({ answer: 'hola', locations: [] })
    await sendChatQuery('¿Dónde queda la biblioteca?')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/api/chat')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ query: '¿Dónde queda la biblioteca?' })
  })

  it('RF-04.15: pasa draw_route y destination a camelCase', async () => {
    backend({
      answer: 'Te guío',
      locations: [{ id: 'rectorado', name: 'Rectorado', schedule: 'Lun–Vie' }],
      draw_route: true,
      destination: { latitude: -12.05, longitude: -77.08 },
    })
    expect(await sendChatQuery('ruta')).toEqual({
      answer: 'Te guío',
      locations: [{ id: 'rectorado', name: 'Rectorado', schedule: 'Lun–Vie' }],
      drawRoute: true,
      destination: { latitude: -12.05, longitude: -77.08 },
    })
  })

  it('RF-04.15: sin draw_route ni destination usa false y null', async () => {
    backend({ answer: 'x', locations: [] })
    const res = await sendChatQuery('x')
    expect(res.drawRoute).toBe(false)
    expect(res.destination).toBeNull()
  })

  it('RF-04.16: sin locations devuelve una lista vacía', async () => {
    backend({ answer: 'x' })
    expect((await sendChatQuery('x')).locations).toEqual([])
  })

  it('RF-04.16: un schedule nulo deja el lugar sin horario', async () => {
    backend({ answer: 'x', locations: [{ id: 'a', name: 'A', schedule: null }] })
    const [place] = (await sendChatQuery('x')).locations
    expect(place.schedule).toBeUndefined()
  })

  it('RF-04.17: sin answer de texto falla con tipo invalid', async () => {
    backend({ locations: [] })
    await expect(sendChatQuery('x')).rejects.toMatchObject({ kind: 'invalid' })
    backend({ answer: 42 })
    await expect(sendChatQuery('x')).rejects.toBeInstanceOf(ApiError)
    backend(null)
    await expect(sendChatQuery('x')).rejects.toMatchObject({ kind: 'invalid' })
  })

  it('RF-04.18: con el mock activo no hace peticiones de red', async () => {
    config.api.useMockChat = true
    vi.useFakeTimers()
    const pending = sendChatQuery('biblioteca')
    await vi.advanceTimersByTimeAsync(700)
    await pending
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('RF-04.19: con el mock activo responde a los 700 ms', async () => {
    config.api.useMockChat = true
    vi.useFakeTimers()
    let done = false
    const pending = sendChatQuery('biblioteca').then(() => (done = true))
    await vi.advanceTimersByTimeAsync(699)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(done).toBe(true)
  })
})
