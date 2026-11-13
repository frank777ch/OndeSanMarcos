import { act } from '@testing-library/react'
import { ApiError } from '@/services/api/client'
import type { Place, PlaceCategory } from '../types'
import { resetPlaces } from '@/test/fixtures/places'
import { PLACES_ERROR_MESSAGE, selectVisibleCategories, usePlacesStore } from './usePlacesStore'

const fetchPlacesAndCategories = vi.fn()
vi.mock('@/services/api/placesApi', () => ({
  fetchPlacesAndCategories: (...args: unknown[]) => fetchPlacesAndCategories(...args),
}))

const place = (id: string, category = 'facultades'): Place => ({ id, name: id, category, coordinates: [-77, -12], keywords: [] })
const categories: PlaceCategory[] = [
  { id: 'facultades', label: 'Facultades', color: '#3056ac' },
  { id: 'puertas', label: 'Puertas', color: '#e74c3c' },
  { id: 'vacia', label: 'Vacía', color: '#757575' },
]

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('usePlacesStore', () => {
  beforeEach(() => {
    fetchPlacesAndCategories.mockReset()
    resetPlaces()
  })

  it('al inicio no hay lugares ni se ha pedido nada', () => {
    expect(usePlacesStore.getState()).toMatchObject({ status: 'idle', places: [], categories: [] })
    expect(fetchPlacesAndCategories).not.toHaveBeenCalled()
  })

  it('RF-28.1: load pide una vez, pasa por loading y termina en ready con byId', async () => {
    const d = deferred<{ places: Place[]; categories: PlaceCategory[] }>()
    fetchPlacesAndCategories.mockReturnValue(d.promise)
    let pending!: Promise<void>
    act(() => {
      pending = usePlacesStore.getState().load()
    })
    expect(usePlacesStore.getState().status).toBe('loading')
    await act(async () => {
      d.resolve({ places: [place('fisi'), place('puerta-1', 'puertas')], categories })
      await pending
    })
    const state = usePlacesStore.getState()
    expect(state.status).toBe('ready')
    expect(state.places.map((p) => p.id)).toEqual(['fisi', 'puerta-1'])
    expect(state.byId['fisi']).toBe(state.places[0])
  })

  it('RF-28.1: no duplica la petición si ya está cargando o ya está listo', async () => {
    const d = deferred<{ places: Place[]; categories: PlaceCategory[] }>()
    fetchPlacesAndCategories.mockReturnValue(d.promise)
    let first!: Promise<void>
    act(() => {
      first = usePlacesStore.getState().load()
      void usePlacesStore.getState().load()
    })
    await act(async () => {
      d.resolve({ places: [place('fisi')], categories })
      await first
    })
    await act(() => usePlacesStore.getState().load())
    expect(fetchPlacesAndCategories).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['sin conexión', new ApiError('network', 'x')],
    ['tiempo agotado', new ApiError('timeout', 'x')],
    ['error del servidor', new ApiError('http', 'x', 500)],
    ['base caída (503)', new ApiError('http', 'x', 503)],
    ['respuesta inválida', new ApiError('invalid', 'x')],
    ['error inesperado', new Error('boom')],
  ])('RF-28.4 y RF-28.5: %s termina en error y deja el store vacío', async (_name, error) => {
    fetchPlacesAndCategories.mockRejectedValue(error)
    await act(() => usePlacesStore.getState().load())
    expect(usePlacesStore.getState()).toMatchObject({ status: 'error', places: [], byId: {}, categories: [] })
  })

  it('RF-28.4: tras un error, volver a llamar a load pide otra vez y puede salir bien', async () => {
    fetchPlacesAndCategories.mockRejectedValueOnce(new ApiError('network', 'x'))
    await act(() => usePlacesStore.getState().load())
    expect(usePlacesStore.getState().status).toBe('error')
    fetchPlacesAndCategories.mockResolvedValueOnce({ places: [place('fisi')], categories })
    await act(() => usePlacesStore.getState().load())
    expect(usePlacesStore.getState().status).toBe('ready')
    expect(fetchPlacesAndCategories).toHaveBeenCalledTimes(2)
  })

  it('RF-28.4: el mensaje de error habla de los lugares, no del asistente ni de detalles técnicos', () => {
    expect(PLACES_ERROR_MESSAGE).toMatch(/lugares del campus/)
    expect(PLACES_ERROR_MESSAGE).not.toMatch(/asistente|503|http|api/i)
  })

  it('RF-28.8: selectVisibleCategories omite las categorías sin lugares y respeta el orden', () => {
    const visible = selectVisibleCategories({ places: [place('p', 'puertas'), place('f')], categories })
    expect(visible.map((c) => c.id)).toEqual(['facultades', 'puertas'])
  })
  it('RF-31.33: refresh vuelve a pedir con fresh, sin pasar por loading, y reemplaza los datos', async () => {
    fetchPlacesAndCategories.mockResolvedValueOnce({ places: [place('fisi')], categories })
    await act(async () => usePlacesStore.getState().load())
    fetchPlacesAndCategories.mockResolvedValueOnce({ places: [place('fisi'), place('nuevo')], categories })
    const statuses: string[] = []
    const unsubscribe = usePlacesStore.subscribe((s) => statuses.push(s.status))
    await act(async () => usePlacesStore.getState().refresh())
    unsubscribe()
    expect(fetchPlacesAndCategories).toHaveBeenLastCalledWith({ fresh: true })
    expect(statuses).not.toContain('loading')
    expect(usePlacesStore.getState().places.map((p) => p.id)).toEqual(['fisi', 'nuevo'])
    expect(usePlacesStore.getState().byId['nuevo']).toBeDefined()
  })

  it('RF-31.33: si refresh falla conserva los datos que ya tenía', async () => {
    fetchPlacesAndCategories.mockResolvedValueOnce({ places: [place('fisi')], categories })
    await act(async () => usePlacesStore.getState().load())
    fetchPlacesAndCategories.mockRejectedValueOnce(new ApiError('network', 'sin red'))
    await act(async () => usePlacesStore.getState().refresh())
    expect(usePlacesStore.getState()).toMatchObject({ status: 'ready' })
    expect(usePlacesStore.getState().places.map((p) => p.id)).toEqual(['fisi'])
  })
})
