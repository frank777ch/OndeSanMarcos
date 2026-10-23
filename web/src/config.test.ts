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
