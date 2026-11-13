import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { ADMIN_PLACES, adminPlace, rawPlace } from '@/test/fixtures/adminPlaces'
import {
  deleteAdminCategory,
  listAdminCategories,
  listAdminPlaces,
  parseFieldErrors,
  reindexAdminPlace,
  saveAdminCategory,
  saveAdminPlace,
  toAdminPlace,
  toInput,
} from './adminPlacesApi'
import { ApiError } from './client'

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))
const lastCall = () => fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit]

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  sessionStorage.clear()
  useAuthStore.setState({ session: { token: 'tok', expiresAt: Date.now() + 60_000 }, expired: false })
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('listAdminPlaces / listAdminCategories', () => {
  it('RF-31.2: lee la lista completa con el token y la pasa a camelCase', async () => {
    fetchMock.mockImplementation(() => json(ADMIN_PLACES.map((p) => rawPlace(p))))
    const places = await listAdminPlaces()
    expect(lastCall()[0]).toMatch(/\/api\/admin\/places$/)
    expect((lastCall()[1].headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(places).toHaveLength(3)
    expect(places[0]).toMatchObject({ id: 'fisi', shortName: 'FISI', verifiedAt: '2026-11-05T09:00:00Z' })
    expect(places[2].isPublished).toBe(false)
  })

  it('una respuesta que no es una lista o un lugar sin datos mínimos es un error «invalid»', async () => {
    fetchMock.mockImplementation(() => json({ no: 'lista' }))
    await expect(listAdminPlaces()).rejects.toMatchObject({ kind: 'invalid' })
    expect(() => toAdminPlace({ id: 'x' })).toThrow(ApiError)
  })

  it('RF-31.28: categorías con su cantidad de lugares', async () => {
    fetchMock.mockImplementation(() => json([{ id: 'a', label: 'A', color: '#111111', sort_order: 3, places_count: 7 }]))
    expect(await listAdminCategories()).toEqual([{ id: 'a', label: 'A', color: '#111111', sortOrder: 3, placesCount: 7 }])
  })
})

describe('toInput · RF-31.9', () => {
  it('conserva todos los campos y solo cambia lo pedido', () => {
    const fisi = ADMIN_PLACES[0]
    const input = toInput(fisi, { isPublished: false })
    expect(input).toEqual({
      name: fisi.name, categoryId: 'facultades', lat: fisi.lat, lng: fisi.lng, shortName: 'FISI',
      keywords: ['informática', 'software'], description: null, schedule: null, detailedSchedule: [],
      phone: '619-7000', annex: null, email: null, website: null, accessHint: null,
      careers: ['Ingeniería de Software'], services: [], usage: null, imageUrl: null,
      parentPlaceId: null, isPublished: false, verified: true,
    })
  })

  it('verified sale de verifiedAt', () => {
    expect(toInput(adminPlace('a')).verified).toBe(false)
    expect(toInput(adminPlace('a', { verifiedAt: '2026-01-01T00:00:00Z' })).verified).toBe(true)
    expect(toInput(adminPlace('a', { verifiedAt: '2026-01-01T00:00:00Z' }), { verified: false }).verified).toBe(false)
  })
})

describe('saveAdminPlace', () => {
  const input = toInput(adminPlace('x', { name: 'Nuevo' }))

  it('RF-31.16: sin id crea con POST y manda snake_case sin id', async () => {
    fetchMock.mockImplementation(() => json(rawPlace(adminPlace('1000', { name: 'Nuevo' }), 'ok'), 201))
    const saved = await saveAdminPlace(null, input)
    const [url, init] = lastCall()
    expect(init.method).toBe('POST')
    expect(url).toMatch(/\/api\/admin\/places$/)
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({ name: 'Nuevo', category_id: 'facultades', is_published: true, verified: false })
    expect(body).not.toHaveProperty('id')
    expect(saved.place.id).toBe('1000')
    expect(saved.ragSync).toBe('ok')
  })

  it('RF-31.16: con id reemplaza con PUT', async () => {
    fetchMock.mockImplementation(() => json(rawPlace(adminPlace('fisi'), 'failed')))
    const saved = await saveAdminPlace('fisi', input)
    expect(lastCall()[1].method).toBe('PUT')
    expect(lastCall()[0]).toMatch(/\/api\/admin\/places\/fisi$/)
    expect(saved.ragSync).toBe('failed')
  })

  it('un rag_sync desconocido se toma como skipped', async () => {
    fetchMock.mockImplementation(() => json(rawPlace(adminPlace('fisi'), 'rarisimo')))
    expect((await saveAdminPlace('fisi', input)).ragSync).toBe('skipped')
  })

  it('RF-31.20: reindex llama a POST …/reindex', async () => {
    fetchMock.mockImplementation(() => json(rawPlace(adminPlace('fisi'), 'ok')))
    expect((await reindexAdminPlace('fisi')).ragSync).toBe('ok')
    expect(lastCall()[0]).toMatch(/\/api\/admin\/places\/fisi\/reindex$/)
    expect(lastCall()[1].method).toBe('POST')
  })
})

describe('categorías', () => {
  it('crea con POST (con id) y edita con PUT (sin id)', async () => {
    fetchMock.mockImplementation(() => json({ id: 'labs', label: 'L', color: '#112233', sort_order: 3, places_count: 0 }, 201))
    await saveAdminCategory(null, { id: 'labs', label: 'L', color: '#112233', sortOrder: null })
    expect(lastCall()[1].method).toBe('POST')
    expect(JSON.parse(lastCall()[1].body as string)).toEqual({ id: 'labs', label: 'L', color: '#112233', sort_order: null })
    await saveAdminCategory('labs', { label: 'L2', color: '#112233', sortOrder: 5 })
    expect(lastCall()[1].method).toBe('PUT')
    expect(lastCall()[0]).toMatch(/place-categories\/labs$/)
    expect(JSON.parse(lastCall()[1].body as string)).toEqual({ label: 'L2', color: '#112233', sort_order: 5 })
  })

  it('RF-31.31: borrar responde 204', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })))
    await expect(deleteAdminCategory('vacia')).resolves.toBeUndefined()
    expect(lastCall()[1].method).toBe('DELETE')
  })
})

describe('parseFieldErrors · RF-31.17', () => {
  const err = (detail: unknown, status = 422) => new ApiError('http', 'x', status, undefined, { detail })

  it('reparte los errores de FastAPI por campo, en camelCase y con texto claro', () => {
    const result = parseFieldErrors(
      err([
        { loc: ['body', 'email'], msg: 'Value error, Debe ser un correo válido.' },
        { loc: ['body', 'category_id'], msg: 'Value error, La categoría no existe.' },
        { loc: ['body', 'name'], msg: 'Field required' },
        { loc: ['body', 'lat'], msg: 'Input should be a valid number' },
        { loc: ['body', 'phone'], msg: 'Value error, Máximo 300 caracteres.' },
      ]),
    )
    expect(result.fields).toEqual({
      email: 'Debe ser un correo válido.',
      categoryId: 'La categoría no existe.',
      name: 'Este campo es obligatorio.',
      lat: 'Debe ser un número.',
      phone: 'Máximo 300 caracteres.',
    })
    expect(result.general).toBeUndefined()
  })

  it('se queda con el primer mensaje de cada campo', () => {
    const result = parseFieldErrors(err([{ loc: ['body', 'name'], msg: 'uno' }, { loc: ['body', 'name'], msg: 'dos' }]))
    expect(result.fields.name).toBe('uno')
  })

  it('un detail de texto (409/404) va a general', () => {
    expect(parseFieldErrors(err('No se puede borrar: la categoría tiene 2 lugares.', 409))).toEqual({
      fields: {},
      general: 'No se puede borrar: la categoría tiene 2 lugares.',
    })
  })

  it('un error sin campo cae en general; sin cuerpo o que no es ApiError no da nada', () => {
    expect(parseFieldErrors(err([{ loc: ['body'], msg: 'Value error, raro' }])).general).toBe('raro')
    expect(parseFieldErrors(new ApiError('network', 'x'))).toEqual({ fields: {} })
    expect(parseFieldErrors(new Error('x'))).toEqual({ fields: {} })
  })
})
