import { act, renderHook } from '@testing-library/react'
import { ApiError } from '@/services/api/client'
import { resetPlaces, seedPlaces, catId } from '@/test/fixtures/places'
import { usePlacesStore } from '../store/usePlacesStore'
import type { Place } from '../types'
import { SEARCH_DEBOUNCE_MS, usePlaceSearch } from './usePlaceSearch'

const searchPlacesApi = vi.hoisted(() => vi.fn())
vi.mock('@/services/api/placesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/placesApi')>()),
  searchPlacesApi: (...args: unknown[]) => searchPlacesApi(...args),
}))

const idBySlug: Record<string, number> = {}
const place = (slug: string, name: string): Place => ({ id: (idBySlug[slug] ??= 5000 + Object.keys(idBySlug).length), slug, name, category: catId('facultades'), coordinates: [-77.08, -12.05], keywords: [] })
const wait = (ms = SEARCH_DEBOUNCE_MS + 10) => act(async () => void (await new Promise((r) => setTimeout(r, ms))))
const ids = (list: Place[]) => list.map((p) => p.slug)

beforeEach(() => {
  searchPlacesApi.mockReset()
  seedPlaces()
})
afterEach(() => resetPlaces())

describe('usePlaceSearch · RF-36.13 a RF-36.17', () => {
  it('RF-36.13: con menos de 2 caracteres no hay resultados ni petición', async () => {
    const { result } = renderHook(() => usePlaceSearch('f'))
    await wait()
    expect(result.current).toEqual({ results: [], pending: false })
    expect(searchPlacesApi).not.toHaveBeenCalled()
  })

  it('RF-36.13: muestra de inmediato los resultados locales y queda «pendiente» hasta la respuesta', () => {
    searchPlacesApi.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => usePlaceSearch('psicolog'))
    expect(ids(result.current.results)).toContain('facultad-de-psicologia')
    expect(result.current.pending).toBe(true)
  })

  it('RF-36.14: tras la pausa pide al servidor y su respuesta reemplaza la lista local', async () => {
    searchPlacesApi.mockResolvedValue([place('biblioteca', 'Biblioteca Central')])
    const { result } = renderHook(() => usePlaceSearch('bibliotca'))
    expect(result.current.results).toEqual([]) // el local no entiende el error de escritura
    expect(searchPlacesApi).not.toHaveBeenCalled() // todavía en la pausa
    await wait()
    expect(searchPlacesApi).toHaveBeenCalledWith('bibliotca', expect.any(AbortSignal))
    expect(ids(result.current.results)).toEqual(['biblioteca'])
    expect(result.current.pending).toBe(false)
  })

  it('RF-36.14: la pausa evita una petición por tecla (solo se pide la última consulta)', async () => {
    searchPlacesApi.mockResolvedValue([])
    const { rerender } = renderHook(({ q }) => usePlaceSearch(q), { initialProps: { q: 'bi' } })
    rerender({ q: 'bib' })
    rerender({ q: 'bibl' })
    await wait()
    expect(searchPlacesApi).toHaveBeenCalledTimes(1)
    expect(searchPlacesApi).toHaveBeenCalledWith('bibl', expect.any(AbortSignal))
  })

  it('RF-36.14 y RF-36.15: una respuesta de una consulta anterior se descarta y la petición vieja se cancela', async () => {
    let resolveOld!: (v: Place[]) => void
    searchPlacesApi.mockImplementationOnce(() => new Promise<Place[]>((r) => (resolveOld = r)))
    searchPlacesApi.mockResolvedValueOnce([place('nuevo', 'Resultado nuevo')])
    const { result, rerender } = renderHook(({ q }) => usePlaceSearch(q), { initialProps: { q: 'viejo' } })
    await wait()
    const oldSignal = searchPlacesApi.mock.calls[0][1] as AbortSignal
    rerender({ q: 'nuevo' })
    expect(oldSignal.aborted).toBe(true)
    await wait()
    await act(async () => resolveOld([place('viejo', 'Resultado viejo')])) // llega tarde
    expect(ids(result.current.results)).toEqual(['nuevo'])
  })

  it('RF-36.16: si el servidor falla se queda con los locales, sin error', async () => {
    searchPlacesApi.mockRejectedValue(new ApiError('network', 'sin red'))
    const { result } = renderHook(() => usePlaceSearch('psicolog'))
    await wait()
    expect(ids(result.current.results)).toContain('facultad-de-psicologia')
    expect(result.current.pending).toBe(false)
  })

  it('RF-36.17: un lugar del servidor que el mapa no conoce se agrega para poder elegirlo', async () => {
    const nuevo = place('laboratorio-nuevo', 'Laboratorio nuevo')
    searchPlacesApi.mockResolvedValue([nuevo])
    expect(usePlacesStore.getState().byId[nuevo.id]).toBeUndefined()
    renderHook(() => usePlaceSearch('laboratorio'))
    await wait()
    expect(usePlacesStore.getState().byId[nuevo.id]).toMatchObject({ name: 'Laboratorio nuevo' })
    expect(usePlacesStore.getState().bySlug['laboratorio-nuevo']).toBeDefined()
    expect(usePlacesStore.getState().places.map((p) => p.id)).toContain(nuevo.id)
  })

  it('al vaciar el campo vuelve a no haber resultados ni pendiente', async () => {
    searchPlacesApi.mockResolvedValue([place('biblioteca', 'Biblioteca')])
    const { result, rerender } = renderHook(({ q }) => usePlaceSearch(q), { initialProps: { q: 'biblio' } })
    await wait()
    rerender({ q: '' })
    expect(result.current).toEqual({ results: [], pending: false })
  })
})
