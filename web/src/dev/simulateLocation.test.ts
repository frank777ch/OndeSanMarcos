import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { haversine, type Coord } from '@/features/routing/utils/distance'
import { CAMPUS } from '@/features/map/constants/campus'
import { startLocationSimulation } from './simulateLocation'

const A: Coord = [-77.08, -12.05]
const B: Coord = [-77.0791, -12.05] // ~98 m al este de A
const ROUTE = { path: [A, B], distance: haversine(A, B) } as never

describe('startLocationSimulation', () => {
  let stop: () => void
  const readings: Coord[] = []
  const watch = () => navigator.geolocation.watchPosition((p) => readings.push([p.coords.longitude, p.coords.latitude]))
  const last = () => readings[readings.length - 1]

  beforeEach(() => {
    vi.useFakeTimers()
    readings.length = 0
    useRouteStore.setState({ activeRoute: null })
    stop = startLocationSimulation({ speed: 10 })
  })
  afterEach(() => {
    stop()
    vi.useRealTimers()
  })

  it('sin ruta se queda en el centro del campus y responde enseguida a quien la sigue', async () => {
    watch()
    await Promise.resolve()
    expect(last()).toEqual(CAMPUS.center)
  })

  it('con ruta avanza `speed` metros por segundo desde el inicio', () => {
    useRouteStore.setState({ activeRoute: ROUTE })
    watch()
    vi.advanceTimersByTime(1000)
    expect(haversine(A, last())).toBeCloseTo(10, 0)
    vi.advanceTimersByTime(2000)
    expect(haversine(A, last())).toBeCloseTo(30, 0)
  })

  it('al llegar descansa y vuelve a empezar', () => {
    useRouteStore.setState({ activeRoute: ROUTE })
    watch()
    vi.advanceTimersByTime(10_000) // ~98 m a 10 m/s: llega en el segundo 10
    expect(last()).toEqual(B)
    vi.advanceTimersByTime(1000)
    expect(last()).toEqual(B) // descansando
    vi.advanceTimersByTime(1000)
    expect(last()).toEqual(A) // reinicia
  })

  it('clearWatch deja de emitir y getCurrentPosition responde con la posición actual', () => {
    useRouteStore.setState({ activeRoute: ROUTE })
    const id = watch()
    vi.advanceTimersByTime(1000)
    const count = readings.length
    navigator.geolocation.clearWatch(id)
    vi.advanceTimersByTime(3000)
    expect(readings.length).toBe(count)
    const onRead = vi.fn()
    navigator.geolocation.getCurrentPosition(onRead)
    expect(onRead).toHaveBeenCalledTimes(1)
  })

  it('el permiso se ve como concedido', async () => {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    expect(status.state).toBe('granted')
  })
})
