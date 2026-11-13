import { useLocationStore } from '../../map/store/useLocationStore'
import {
  LOCATE_FAILED_NOTICE,
  NO_LOCATION_NOTICE,
  useRouteStore,
} from './useRouteStore'
import { idOf, seedPlaces } from '@/test/fixtures/places'

const place = (slug: string) => ({ kind: 'place' as const, placeId: idOf(slug) })
const reset = () =>
  useRouteStore.setState({
    open: false,
    origin: null,
    destination: null,
    status: 'idle',
    result: null,
    activeRoute: null,
    notice: null,
  })
const flush = () => vi.advanceTimersByTimeAsync(1)

describe('useRouteStore', () => {
  beforeEach(() => {
    seedPlaces()
    vi.useFakeTimers()
    reset()
    useLocationStore.setState({ permission: 'granted', position: null, locating: false })
  })
  afterEach(() => vi.useRealTimers())

  it('RF-13.19: calcula solo cuando hay origen y destino', async () => {
    const s = useRouteStore.getState()
    s.setOrigin(place('biblioteca-central'))
    await flush()
    expect(useRouteStore.getState().result).toBeNull()
    expect(useRouteStore.getState().status).toBe('idle')
    s.setDestination(place('fisi'))
    expect(useRouteStore.getState().status).toBe('calculating')
    await flush()
    const { status, result } = useRouteStore.getState()
    expect(status).toBe('done')
    expect(result?.ok).toBe(true)
  })

  it('RF-13.27: la ruta calculada queda guardada con path y distancia', async () => {
    useRouteStore.getState().setOrigin(place('biblioteca-central'))
    useRouteStore.getState().setDestination(place('fisi'))
    await flush()
    const { result } = useRouteStore.getState()
    expect(result?.ok && result.route.path.length).toBeGreaterThan(1)
    expect(result?.ok && result.route.distance).toBeGreaterThan(0)
  })

  it('RF-13.13: el mismo lugar da error', async () => {
    useRouteStore.getState().setOrigin(place('puerta-3'))
    useRouteStore.getState().setDestination(place('puerta-3'))
    await flush()
    expect(useRouteStore.getState().result).toEqual({ ok: false, error: 'same-place' })
  })

  it('RF-13.25: cambiar un punto descarta el resultado viejo', async () => {
    const s = useRouteStore.getState()
    s.setOrigin(place('biblioteca-central'))
    s.setDestination(place('fisi'))
    s.setDestination(place('puerta-3')) // antes de que termine el primer cálculo
    await flush()
    const { result } = useRouteStore.getState()
    expect(result?.ok && result.route.destination).toEqual(place('puerta-3'))
  })

  it('RF-13.25 y RF-13.30: vaciar un campo quita el resultado', async () => {
    const s = useRouteStore.getState()
    s.setOrigin(place('biblioteca-central'))
    s.setDestination(place('fisi'))
    await flush()
    s.setDestination(null)
    expect(useRouteStore.getState().result).toBeNull()
    expect(useRouteStore.getState().status).toBe('idle')
    await flush()
    expect(useRouteStore.getState().result).toBeNull()
  })

  it('RF-13.12: swap intercambia, incluidos campos vacíos, y recalcula', async () => {
    const s = useRouteStore.getState()
    s.setOrigin(place('biblioteca-central'))
    await flush()
    s.swap()
    expect(useRouteStore.getState().origin).toBeNull()
    expect(useRouteStore.getState().destination).toEqual(place('biblioteca-central'))
    s.setOrigin(place('fisi'))
    await flush()
    s.swap()
    await flush()
    const st = useRouteStore.getState()
    expect(st.origin).toEqual(place('biblioteca-central'))
    expect(st.destination).toEqual(place('fisi'))
    expect(st.result?.ok).toBe(true)
  })

  it('RF-13.6: cerrar y abrir conserva origen, destino y resultado', async () => {
    const s = useRouteStore.getState()
    s.openDialog()
    s.setOrigin(place('biblioteca-central'))
    s.setDestination(place('fisi'))
    await flush()
    s.closeDialog()
    expect(useRouteStore.getState().open).toBe(false)
    s.openDialog()
    const st = useRouteStore.getState()
    expect(st.open).toBe(true)
    expect(st.origin).toEqual(place('biblioteca-central'))
    expect(st.result?.ok).toBe(true)
  })

  it('RF-13.32: openDialog con un destino lo fija y conserva el origen', () => {
    useRouteStore.getState().setOrigin(place('fisi'))
    useRouteStore.getState().openDialog(idOf('puerta-3'))
    const st = useRouteStore.getState()
    expect(st.destination).toEqual(place('puerta-3'))
    expect(st.origin).toEqual(place('fisi'))
  })

  it('RF-13.38: startRoute guarda la ruta activa y cierra el diálogo', async () => {
    const s = useRouteStore.getState()
    s.openDialog()
    s.setOrigin(place('biblioteca-central'))
    s.setDestination(place('fisi'))
    await flush()
    s.startRoute()
    const st = useRouteStore.getState()
    expect(st.open).toBe(false)
    expect(st.activeRoute).toEqual(st.result?.ok ? st.result.route : null)
    expect(st.activeRoute?.path.length).toBeGreaterThan(1)
  })

  it('RF-13.37: startRoute sin ruta válida no hace nada', async () => {
    const s = useRouteStore.getState()
    s.openDialog()
    s.setOrigin(place('puerta-3'))
    s.setDestination(place('puerta-3'))
    await flush()
    s.startRoute()
    expect(useRouteStore.getState().activeRoute).toBeNull()
    expect(useRouteStore.getState().open).toBe(true)
  })

  it('RF-13.40 y RF-13.41: editar el diálogo no altera la ruta activa; clearActiveRoute la quita y conserva los campos', async () => {
    const s = useRouteStore.getState()
    s.setOrigin(place('biblioteca-central'))
    s.setDestination(place('fisi'))
    await flush()
    s.startRoute()
    const active = useRouteStore.getState().activeRoute
    s.setDestination(place('puerta-3'))
    await flush()
    expect(useRouteStore.getState().activeRoute).toBe(active)
    s.clearActiveRoute()
    expect(useRouteStore.getState().activeRoute).toBeNull()
    expect(useRouteStore.getState().origin).toEqual(place('biblioteca-central'))
    expect(useRouteStore.getState().destination).toEqual(place('puerta-3'))
  })

  describe('mi ubicación', () => {
    const position = { coordinates: [-77.0827, -12.0565] as [number, number], accuracy: 10 }
    const locate = vi.fn()

    beforeEach(() => {
      locate.mockReset()
      useLocationStore.setState({ locate })
    })

    it('RF-13.15: con permiso usa una lectura nueva como origen', async () => {
      locate.mockResolvedValue(position)
      await useRouteStore.getState().chooseMyLocation()
      expect(useRouteStore.getState().origin).toEqual({ kind: 'my-location', coordinates: position.coordinates })
    })

    it('RF-13.16: mientras lee ubicación el estado es «locating» y no hay cálculo', async () => {
      useRouteStore.getState().setDestination(place('fisi'))
      let resolve!: (p: typeof position) => void
      locate.mockReturnValue(new Promise((r) => (resolve = r)))
      const pending = useRouteStore.getState().chooseMyLocation()
      expect(useRouteStore.getState().status).toBe('locating')
      expect(useRouteStore.getState().result).toBeNull()
      resolve(position)
      await pending
      await flush()
      expect(useRouteStore.getState().status).toBe('done')
    })

    it('RF-13.17: si la lectura falla, el origen queda vacío y hay aviso', async () => {
      locate.mockResolvedValue(null)
      await useRouteStore.getState().chooseMyLocation()
      const st = useRouteStore.getState()
      expect(st.origin).toBeNull()
      expect(st.notice).toBe(LOCATE_FAILED_NOTICE)
      expect(st.status).toBe('idle')
    })

    it('RF-13.17: con permiso denegado no pide nada', async () => {
      useLocationStore.setState({ permission: 'denied' })
      await useRouteStore.getState().chooseMyLocation()
      expect(locate).not.toHaveBeenCalled()
      expect(useRouteStore.getState().notice).toBe(NO_LOCATION_NOTICE)
      expect(useRouteStore.getState().origin).toBeNull()
    })

    it('RF-13.17: si el permiso se niega al leer, el aviso es el de «sin ubicación»', async () => {
      locate.mockImplementation(async () => {
        useLocationStore.setState({ permission: 'denied' })
        return null
      })
      await useRouteStore.getState().chooseMyLocation()
      expect(useRouteStore.getState().notice).toBe(NO_LOCATION_NOTICE)
    })

    it('RF-13.18: con el permiso sin decidir llama a locate (que pide el permiso)', async () => {
      useLocationStore.setState({ permission: 'prompt' })
      locate.mockResolvedValue(position)
      await useRouteStore.getState().chooseMyLocation()
      expect(locate).toHaveBeenCalledTimes(1)
    })
  })
})
