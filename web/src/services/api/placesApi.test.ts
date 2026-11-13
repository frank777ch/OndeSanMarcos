import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { fetchPlacesAndCategories, toPlace } from './placesApi'

vi.mock('@/config', () => ({
  Config: {
    api: { baseUrl: 'http://api.test', timeoutMs: 30_000, useMockChat: false },
    dev: { enableLogs: false },
  },
}))

const fetchMock = vi.fn()

const apiPlace = (over: Record<string, unknown> = {}) => ({
  id: 'fisi',
  name: 'FISI',
  short_name: null,
  category_id: 'facultades',
  lat: -12.05,
  lng: -77.08,
  keywords: ['fisi'],
  description: null,
  schedule: 'Lun–Vie',
  detailed_schedule: [],
  phone: null,
  annex: null,
  email: null,
  website: null,
  access_hint: null,
  careers: [],
  services: [],
  usage: null,
  image_url: null,
  parent_place_id: null,
  is_published: true,
  verified_at: null,
  updated_at: '2026-11-12T00:00:00Z',
  ...over,
})
const apiCategory = { id: 'facultades', label: 'Facultades', color: '#3056ac' }

function backend(places: unknown, categories: unknown = [apiCategory]) {
  fetchMock.mockImplementation(async (url: string) => {
    const body = String(url).endsWith('/api/places') ? places : categories
    return new Response(JSON.stringify(body), { status: 200 })
  })
}

describe('placesApi', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('RF-28.1: hace GET a /api/places y /api/place-categories', async () => {
    backend([apiPlace()])
    await fetchPlacesAndCategories()
    const calls = fetchMock.mock.calls.map(([url, init]) => [url, init.method])
    expect(calls).toHaveLength(2)
    expect(calls).toContainEqual(['http://api.test/api/places', 'GET'])
    expect(calls).toContainEqual(['http://api.test/api/place-categories', 'GET'])
  })

  it('RF-28.2: lat y lng pasan a coordinates como [lng, lat]', () => {
    expect(toPlace(apiPlace({ lat: -12.5, lng: -77.5 })).coordinates).toEqual([-77.5, -12.5])
  })

  it('RF-28.2: detailed_schedule, category_id y el resto pasan a camelCase', () => {
    const place = toPlace(
      apiPlace({
        short_name: 'FISI',
        detailed_schedule: ['Lun'],
        access_hint: 'Puerta 3',
        image_url: 'https://x/y.png',
        parent_place_id: 'campus',
        verified_at: '2026-01-01T00:00:00Z',
      }),
    )
    expect(place).toMatchObject({
      category: 'facultades',
      shortName: 'FISI',
      detailedSchedule: ['Lun'],
      accessHint: 'Puerta 3',
      imageUrl: 'https://x/y.png',
      parentPlaceId: 'campus',
      verifiedAt: '2026-01-01T00:00:00Z',
    })
  })

  it('RF-28.2: null, textos vacíos y listas vacías pasan a sin dato', () => {
    const place = toPlace(apiPlace({ description: '  ', phone: null, careers: [], services: [] }))
    expect(place.description).toBeUndefined()
    expect(place.phone).toBeUndefined()
    expect(place.careers).toBeUndefined()
    expect(place.services).toBeUndefined()
    expect(place.detailedSchedule).toBeUndefined()
    expect(place.keywords).toEqual(['fisi'])
  })

  it('RF-28.13: el id es el slug de la API', async () => {
    backend([apiPlace({ id: 'puerta-8' })])
    expect((await fetchPlacesAndCategories()).places[0].id).toBe('puerta-8')
  })

  it('devuelve las categorías con id, etiqueta y color', async () => {
    backend([apiPlace()])
    expect((await fetchPlacesAndCategories()).categories).toEqual([apiCategory])
  })

  it('RF-28.4: una respuesta que no es una lista es un error «invalid»', async () => {
    backend({ detail: 'x' })
    await expect(fetchPlacesAndCategories()).rejects.toMatchObject({ kind: 'invalid' })
    backend([apiPlace()], { detail: 'x' })
    await expect(fetchPlacesAndCategories()).rejects.toMatchObject({ kind: 'invalid' })
  })

  it('RF-28.4: un lugar sin coordenadas o sin nombre es un error «invalid», no se descarta', async () => {
    backend([apiPlace(), apiPlace({ id: 'roto', lat: null })])
    await expect(fetchPlacesAndCategories()).rejects.toBeInstanceOf(ApiError)
    expect(() => toPlace(apiPlace({ name: '' }))).toThrow(ApiError)
  })

  it('RF-28.4 y RF-28.5: un 503 es un error http', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 503 }))
    await expect(fetchPlacesAndCategories()).rejects.toMatchObject({ kind: 'http', status: 503 })
  })
})

describe('searchPlacesApi · HU-36', () => {
  const fetchMock = vi.fn()
  beforeEach(() => vi.stubGlobal('fetch', fetchMock))
  afterEach(() => fetchMock.mockReset())

  it('RF-36.14: pide /api/places/search con la consulta codificada y convierte los lugares', async () => {
    const { searchPlacesApi } = await import('./placesApi')
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ id: 'biblioteca', name: 'Biblioteca', category_id: 'servicios', lat: -12.05, lng: -77.08 }]), { status: 200 }),
      ),
    )
    const found = await searchPlacesApi('biblio & más')
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/places\/search\?q=biblio%20%26%20m%C3%A1s$/)
    expect(found).toEqual([expect.objectContaining({ id: 'biblioteca', name: 'Biblioteca', category: 'servicios', coordinates: [-77.08, -12.05] })])
  })

  it('RF-36.15: una petición cancelada falla sin contarse como «tiempo agotado»', async () => {
    const { searchPlacesApi } = await import('./placesApi')
    const controller = new AbortController()
    fetchMock.mockImplementation((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')))),
    )
    const pending = searchPlacesApi('biblio', controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ kind: 'network' })
  })

  it('una respuesta que no es una lista es un error «invalid»', async () => {
    const { searchPlacesApi } = await import('./placesApi')
    fetchMock.mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 })))
    await expect(searchPlacesApi('biblio')).rejects.toMatchObject({ kind: 'invalid' })
  })
})
