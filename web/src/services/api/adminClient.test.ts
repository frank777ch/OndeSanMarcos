import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { adminClient, fetchMe } from './adminClient'
import { apiClient } from './client'

const fetchMock = vi.fn()

describe('adminClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
    useAuthStore.setState({ session: { token: 'tok-123', expiresAt: Date.now() + 60_000 }, expired: false })
  })
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('RF-26.18: añade Authorization: Bearer con el token de la sesión', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ username: 'admin' }), { status: 200 }))
    expect(await fetchMe()).toEqual({ username: 'admin' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/auth\/me$/)
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok-123')
  })

  it('RF-26.18: el cliente público (chat) no envía token', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    await apiClient.post('/api/chat', { query: 'x' })
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('RF-26.17: un 401 cierra la sesión y la marca como vencida', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))
    await expect(adminClient.get('/api/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(useAuthStore.getState()).toMatchObject({ session: null, expired: true })
  })

  it('RF-26.14: otros errores no cierran la sesión', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))
    await expect(adminClient.get('/api/auth/me')).rejects.toMatchObject({ status: 503 })
    expect(useAuthStore.getState().session).not.toBeNull()
    fetchMock.mockRejectedValue(new TypeError('red'))
    await expect(adminClient.get('/x')).rejects.toMatchObject({ kind: 'network' })
    expect(useAuthStore.getState().session).not.toBeNull()
  })

  it('sin sesión no hace ninguna petición', async () => {
    useAuthStore.setState({ session: null })
    await expect(adminClient.get('/x')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('RF-31.34: PUT y DELETE llevan el token y un 401 cierra la sesión', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })))
    await adminClient.put('/api/admin/places/fisi', { name: 'X' })
    await adminClient.delete('/api/admin/place-categories/x')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PUT', headers: { Authorization: 'Bearer tok-123' } })
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE', headers: { Authorization: 'Bearer tok-123' } })
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))
    await expect(adminClient.put('/x', {})).rejects.toMatchObject({ status: 401 })
    expect(useAuthStore.getState()).toMatchObject({ session: null, expired: true })
  })
})
