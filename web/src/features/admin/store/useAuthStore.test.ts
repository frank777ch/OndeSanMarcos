import { ApiError } from '@/services/api/client'
import { useAuthStore } from './useAuthStore'

const loginRequest = vi.fn()
vi.mock('@/services/api/authApi', () => ({
  loginRequest: (u: string, p: string) => loginRequest(u, p),
}))

const KEY = 'osm:admin-session'

describe('useAuthStore', () => {
  beforeEach(() => {
    loginRequest.mockReset()
    sessionStorage.clear()
    useAuthStore.setState({ session: null, expired: false })
  })

  it('RF-26.4 y RF-26.10: el login guarda solo el token y su vencimiento', async () => {
    loginRequest.mockResolvedValue({ token: 'tok', expiresAt: Date.now() + 60_000 })
    await useAuthStore.getState().login('admin', 'clave-secreta')
    expect(useAuthStore.getState().session?.token).toBe('tok')
    const stored = sessionStorage.getItem(KEY)!
    expect(Object.keys(JSON.parse(stored)).sort()).toEqual(['expiresAt', 'token'])
    expect(stored).not.toContain('clave-secreta')
    expect(JSON.stringify(useAuthStore.getState())).not.toContain('clave-secreta')
  })

  it('RF-26.4: si el login falla no hay sesión y el error se propaga', async () => {
    loginRequest.mockRejectedValue(new ApiError('http', 'x', 401))
    await expect(useAuthStore.getState().login('a', 'b')).rejects.toMatchObject({ status: 401 })
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('RF-26.16: logout borra la sesión y el almacenamiento', async () => {
    loginRequest.mockResolvedValue({ token: 'tok', expiresAt: Date.now() + 60_000 })
    await useAuthStore.getState().login('a', 'b')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState()).toMatchObject({ session: null, expired: false })
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('RF-26.17: logout("expired") marca la sesión como vencida y clearExpired la limpia', () => {
    useAuthStore.getState().logout('expired')
    expect(useAuthStore.getState().expired).toBe(true)
    useAuthStore.getState().clearExpired()
    expect(useAuthStore.getState().expired).toBe(false)
  })

  it('RF-26.9: al recargar se recupera la sesión guardada', async () => {
    sessionStorage.setItem(KEY, JSON.stringify({ token: 't', expiresAt: Date.now() + 60_000 }))
    vi.resetModules()
    const { useAuthStore: fresh } = await import('./useAuthStore')
    expect(fresh.getState().session?.token).toBe('t')
  })

  it('RF-26.11: una sesión vencida o dañada se descarta', async () => {
    sessionStorage.setItem(KEY, JSON.stringify({ token: 't', expiresAt: Date.now() - 1 }))
    vi.resetModules()
    expect((await import('./useAuthStore')).useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()

    sessionStorage.setItem(KEY, 'no-es-json')
    vi.resetModules()
    expect((await import('./useAuthStore')).useAuthStore.getState().session).toBeNull()
  })
})
