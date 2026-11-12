import { loginRequest } from './authApi'

const fetchMock = vi.fn()

describe('loginRequest', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('RF-26.4: hace POST a /api/auth/login y convierte expires_in en un vencimiento', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'tok', token_type: 'bearer', expires_in: 3600 }), { status: 200 }),
    )
    const before = Date.now()
    const session = await loginRequest('admin', 'clave')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/auth\/login$/)
    expect(JSON.parse(init.body)).toEqual({ username: 'admin', password: 'clave' })
    expect(init.headers.Authorization).toBeUndefined()
    expect(session.token).toBe('tok')
    expect(session.expiresAt).toBeGreaterThanOrEqual(before + 3_600_000)
  })

  it('RF-26.6: un 429 trae los segundos de espera de Retry-After', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429, headers: { 'Retry-After': '900' } }))
    await expect(loginRequest('a', 'b')).rejects.toMatchObject({ status: 429, retryAfterSeconds: 900 })
  })

  it('una respuesta sin token es inválida', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    await expect(loginRequest('a', 'b')).rejects.toMatchObject({ kind: 'invalid' })
  })
})
