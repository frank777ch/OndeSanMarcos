import { LocationError } from '../utils/geolocation'
import { NOTICE_DISMISSED_KEY, useLocationStore } from './useLocationStore'

const geo = vi.hoisted(() => ({
  has: true,
  permission: 'prompt' as 'prompt' | 'granted' | 'denied',
  read: vi.fn(),
}))

vi.mock('../utils/geolocation', async (orig) => {
  const actual = await orig<typeof import('../utils/geolocation')>()
  return {
    ...actual,
    hasGeolocation: () => geo.has,
    queryPermission: async () => geo.permission,
    watchPermissionChange: () => () => {},
    readPosition: geo.read,
  }
})

const POS = { coordinates: [-77.08, -12.05] as [number, number], accuracy: 20 }
const reset = () =>
  useLocationStore.setState({ permission: 'unknown', noticeOpen: false, position: null, locating: false })
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('useLocationStore', () => {
  beforeEach(() => {
    reset()
    sessionStorage.clear()
    geo.has = true
    geo.permission = 'prompt'
    geo.read.mockReset()
  })

  it('RF-15.1: con permiso sin decidir abre el aviso', async () => {
    useLocationStore.getState().init()
    await flush()
    expect(useLocationStore.getState().noticeOpen).toBe(true)
  })

  it('RF-15.4: con permiso ya concedido o denegado no abre el aviso', async () => {
    for (const p of ['granted', 'denied'] as const) {
      reset()
      geo.permission = p
      useLocationStore.getState().init()
      await flush()
      expect(useLocationStore.getState().noticeOpen).toBe(false)
      expect(useLocationStore.getState().permission).toBe(p)
    }
  })

  it('RF-15.5: sin geolocalización no abre el aviso', async () => {
    geo.has = false
    useLocationStore.getState().init()
    await flush()
    expect(useLocationStore.getState().noticeOpen).toBe(false)
    expect(useLocationStore.getState().permission).toBe('unsupported')
  })

  it('RF-15.3: «Ahora no» cierra, no lee y no vuelve a abrir en la pestaña', async () => {
    useLocationStore.getState().init()
    await flush()
    useLocationStore.getState().dismissNotice()
    expect(useLocationStore.getState().noticeOpen).toBe(false)
    expect(geo.read).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(NOTICE_DISMISSED_KEY)).toBe('1')
    useLocationStore.getState().init()
    await flush()
    expect(useLocationStore.getState().noticeOpen).toBe(false)
  })

  it('RF-15.3: en una pestaña nueva (sin la clave) el aviso vuelve', async () => {
    useLocationStore.getState().dismissNotice()
    sessionStorage.clear()
    useLocationStore.getState().init()
    await flush()
    expect(useLocationStore.getState().noticeOpen).toBe(true)
  })

  it('RF-15.2 y RF-15.10: «Permitir» cierra, pide una lectura y la descarta', async () => {
    geo.read.mockResolvedValue(POS)
    useLocationStore.setState({ noticeOpen: true })
    await useLocationStore.getState().allow()
    expect(geo.read).toHaveBeenCalledTimes(1)
    expect(useLocationStore.getState().noticeOpen).toBe(false)
    expect(useLocationStore.getState().permission).toBe('granted')
    expect(useLocationStore.getState().position).toBeNull()
  })

  it('RF-15.8: si el navegador deniega, el permiso queda denegado', async () => {
    geo.read.mockRejectedValue(new LocationError(true, 'denied'))
    await useLocationStore.getState().allow()
    expect(useLocationStore.getState().permission).toBe('denied')
  })

  it('RF-15.7: locate guarda la posición', async () => {
    geo.read.mockResolvedValue(POS)
    expect(await useLocationStore.getState().locate()).toEqual(POS)
    expect(useLocationStore.getState().position).toEqual(POS)
    expect(useLocationStore.getState().locating).toBe(false)
  })

  it('RF-15.17: una segunda lectura reemplaza a la primera', async () => {
    geo.read.mockResolvedValueOnce(POS).mockResolvedValueOnce({ ...POS, accuracy: 5 })
    await useLocationStore.getState().locate()
    await useLocationStore.getState().locate()
    expect(useLocationStore.getState().position?.accuracy).toBe(5)
  })

  it('RF-15.9 y RF-15.19: si falla, devuelve null y no cambia la posición', async () => {
    geo.read.mockResolvedValueOnce(POS).mockRejectedValueOnce(new LocationError(false, 'timeout'))
    await useLocationStore.getState().locate()
    expect(await useLocationStore.getState().locate()).toBeNull()
    expect(useLocationStore.getState().position).toEqual(POS)
    expect(useLocationStore.getState().permission).not.toBe('denied')
  })

  it('RF-15.11: dos locate() seguidos hacen una sola lectura', async () => {
    let resolve!: (p: typeof POS) => void
    geo.read.mockReturnValue(new Promise((r) => (resolve = r)))
    const first = useLocationStore.getState().locate()
    expect(useLocationStore.getState().locating).toBe(true)
    expect(await useLocationStore.getState().locate()).toBeNull()
    resolve(POS)
    await first
    expect(geo.read).toHaveBeenCalledTimes(1)
  })
})
