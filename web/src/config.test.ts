describe('Config.mapbox', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function load(token: string) {
    vi.stubEnv('VITE_MAPBOX_TOKEN', token)
    vi.resetModules()
    return (await import('./config')).Config
  }

  it('acepta un token público válido', async () => {
    expect((await load('pk.abc.def')).mapbox.hasToken).toBe(true)
  })

  it('rechaza vacío, el valor de ejemplo y tokens secretos', async () => {
    expect((await load('')).mapbox.hasToken).toBe(false)
    expect((await load('pk.REEMPLAZAR_CON_TU_TOKEN_PUBLICO')).mapbox.hasToken).toBe(false)
    expect((await load('sk.abc')).mapbox.hasToken).toBe(false)
  })
})

describe('Config.api y Config.dev', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function load(env: Record<string, string>) {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
    vi.resetModules()
    return (await import('./config')).Config
  }

  it('RF-04.1: usa localhost:8000 si falta VITE_API_URL', async () => {
    expect((await load({ VITE_API_URL: '' })).api.baseUrl).toBe('http://localhost:8000')
  })

  it('RF-04.1: quita las barras finales de la dirección', async () => {
    expect((await load({ VITE_API_URL: 'http://x:8000/' })).api.baseUrl).toBe('http://x:8000')
    expect((await load({ VITE_API_URL: 'http://x:8000//' })).api.baseUrl).toBe('http://x:8000')
  })

  it('RF-04.2: el tiempo máximo es de 30 segundos', async () => {
    expect((await load({})).api.timeoutMs).toBe(30_000)
  })

  it('RF-04.3: el mock solo se activa con "true" exacto', async () => {
    expect((await load({ VITE_USE_MOCK_CHAT: 'true' })).api.useMockChat).toBe(true)
    expect((await load({ VITE_USE_MOCK_CHAT: 'TRUE' })).api.useMockChat).toBe(false)
    expect((await load({ VITE_USE_MOCK_CHAT: '1' })).api.useMockChat).toBe(false)
    expect((await load({ VITE_USE_MOCK_CHAT: '' })).api.useMockChat).toBe(false)
  })

  it('RF-04.4: los logs requieren la variable en "true"', async () => {
    expect((await load({ VITE_ENABLE_DEV_LOGS: 'true' })).dev.enableLogs).toBe(true)
    expect((await load({ VITE_ENABLE_DEV_LOGS: 'false' })).dev.enableLogs).toBe(false)
  })

  it('RF-04.4: los logs se apagan fuera de desarrollo', async () => {
    vi.stubEnv('DEV', false)
    expect((await load({ VITE_ENABLE_DEV_LOGS: 'true' })).dev.enableLogs).toBe(false)
  })
})
