import { act } from '@testing-library/react'
import { useToastStore } from '@/components/Toast/toastStore'
import { ApiError } from '@/services/api/client'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import { ADMIN_PLACES, adminId, adminPlace } from '@/test/fixtures/adminPlaces'
import { useAdminCategoriesStore } from '../../categories/store/useAdminCategoriesStore'
import { EMPTY_FILTERS } from '../utils/filters'
import { toInput } from '@/services/api/adminPlacesApi'
import { useAdminPlacesStore } from './useAdminPlacesStore'

const api = vi.hoisted(() => ({
  listAdminPlaces: vi.fn(),
  saveAdminPlace: vi.fn(),
  reindexAdminPlace: vi.fn(),
  listAdminCategories: vi.fn(),
}))
vi.mock('@/services/api/adminPlacesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminPlacesApi')>()),
  ...api,
}))

const refresh = vi.fn()
const store = () => useAdminPlacesStore.getState()
const toasts = () => useToastStore.getState().toasts.map((t) => t.message)

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset())
  api.listAdminCategories.mockResolvedValue([])
  refresh.mockReset()
  usePlacesStore.setState({ refresh })
  useToastStore.setState({ toasts: [] })
  useAdminCategoriesStore.setState({ status: 'idle', categories: [] })
  useAdminPlacesStore.setState({
    status: 'ready', places: [...ADMIN_PLACES], filters: EMPTY_FILTERS, page: 1, busy: {}, ragWarning: null,
  })
})

describe('load · RF-31.2, RF-31.3', () => {
  it('pasa por loading y termina en ready con los lugares por nombre', async () => {
    api.listAdminPlaces.mockResolvedValue([adminPlace('b', { name: 'Beta' }), adminPlace('a', { name: 'Álamo' })])
    const pending = store().load()
    expect(store().status).toBe('loading')
    await act(async () => pending)
    expect(store().status).toBe('ready')
    expect(store().places.map((p) => p.slug)).toEqual(['a', 'b'])
  })

  it('un fallo deja el estado en error', async () => {
    api.listAdminPlaces.mockRejectedValue(new ApiError('network', 'x'))
    await act(async () => store().load())
    expect(store().status).toBe('error')
  })

  it('una recarga silenciosa fallida conserva la tabla', async () => {
    api.listAdminPlaces.mockRejectedValue(new ApiError('network', 'x'))
    await act(async () => store().load({ quiet: true }))
    expect(store().status).toBe('ready')
    expect(store().places).toHaveLength(3)
  })
})

describe('filtros y página · RF-31.6', () => {
  it('cambiar un filtro o la búsqueda vuelve a la página 1; resetFilters también', () => {
    store().setPage(3)
    store().setFilters({ q: 'psi' })
    expect(store()).toMatchObject({ page: 1, filters: { q: 'psi' } })
    store().setPage(2)
    store().resetFilters()
    expect(store()).toMatchObject({ page: 1, filters: EMPTY_FILTERS })
  })

  it('guardar un lugar conserva filtros y página', async () => {
    store().setFilters({ verified: 'no' })
    store().setPage(2)
    api.saveAdminPlace.mockResolvedValue({ place: adminPlace('fisi', { name: 'FISI nueva' }), ragSync: 'ok' })
    await act(async () => void (await store().save(adminId('fisi'), toInput(ADMIN_PLACES[0]))))
    expect(store()).toMatchObject({ page: 2, filters: { verified: 'no' } })
  })
})

describe('save · RF-31.16, RF-31.33', () => {
  it('crea: agrega el lugar devuelto, avisa, y refresca el mapa público y las categorías', async () => {
    const created = adminPlace('zeta-nuevo', { name: 'Zeta nuevo' })
    api.saveAdminPlace.mockResolvedValue({ place: created, ragSync: 'ok' })
    await act(async () => void (await store().save(null, toInput(created))))
    expect(api.saveAdminPlace).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Zeta nuevo' }))
    expect(store().places.map((p) => p.id)).toContain(adminId('zeta-nuevo'))
    expect(toasts()).toContain('Lugar guardado')
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(api.listAdminCategories).toHaveBeenCalledTimes(1)
  })

  it('edita: reemplaza el lugar con lo que devolvió el servidor', async () => {
    api.saveAdminPlace.mockResolvedValue({
      place: adminPlace('fisi', { name: 'FISI', verifiedAt: '2026-11-12T00:00:00Z', updatedBy: 'maria' }),
      ragSync: 'ok',
    })
    await act(async () => void (await store().save(adminId('fisi'), toInput(ADMIN_PLACES[0]))))
    const fisi = store().places.find((p) => p.slug === 'fisi')!
    expect(store().places).toHaveLength(3)
    expect(fisi.updatedBy).toBe('maria')
  })

  it('un error se propaga y no cambia nada ni refresca', async () => {
    api.saveAdminPlace.mockRejectedValue(new ApiError('http', 'x', 422, undefined, { detail: [] }))
    await expect(store().save(adminId('fisi'), toInput(ADMIN_PLACES[0]))).rejects.toMatchObject({ status: 422 })
    expect(store().places).toEqual(ADMIN_PLACES)
    expect(refresh).not.toHaveBeenCalled()
    expect(toasts()).toEqual([])
  })
})

describe('acciones de fila · RF-31.8 a RF-31.10', () => {
  it('despublicar envía el lugar completo con solo isPublished cambiado', async () => {
    const fisi = ADMIN_PLACES[0]
    api.saveAdminPlace.mockResolvedValue({ place: { ...fisi, isPublished: false }, ragSync: 'ok' })
    expect(await store().togglePublished(fisi)).toBe(true)
    expect(api.saveAdminPlace).toHaveBeenCalledWith(adminId('fisi'), { ...toInput(fisi), isPublished: false })
    expect(store().places.find((p) => p.slug === 'fisi')!.isPublished).toBe(false)
    expect(toasts()).toContain('Lugar despublicado')
  })

  it('publicar un lugar oculto', async () => {
    const oculto = ADMIN_PLACES[2]
    api.saveAdminPlace.mockResolvedValue({ place: { ...oculto, isPublished: true }, ragSync: 'ok' })
    await store().togglePublished(oculto)
    expect(api.saveAdminPlace).toHaveBeenCalledWith(adminId('puerta-3'), expect.objectContaining({ isPublished: true }))
    expect(toasts()).toContain('Lugar publicado')
  })

  it('verificar y quitar la verificación', async () => {
    const psico = ADMIN_PLACES[1]
    api.saveAdminPlace.mockResolvedValue({ place: { ...psico, verifiedAt: '2026-11-12T00:00:00Z' }, ragSync: 'ok' })
    await store().toggleVerified(psico)
    expect(api.saveAdminPlace).toHaveBeenLastCalledWith(adminId('psicologia'), expect.objectContaining({ verified: true }))
    const fisi = ADMIN_PLACES[0] // ya verificado
    api.saveAdminPlace.mockResolvedValue({ place: { ...fisi, verifiedAt: null }, ragSync: 'ok' })
    await store().toggleVerified(fisi)
    expect(api.saveAdminPlace).toHaveBeenLastCalledWith(adminId('fisi'), expect.objectContaining({ verified: false }))
    expect(toasts()).toEqual(expect.arrayContaining(['Lugar verificado', 'Verificación quitada']))
  })

  it('la fila queda ocupada mientras guarda y se libera al terminar', async () => {
    let resolve!: (v: unknown) => void
    api.saveAdminPlace.mockReturnValue(new Promise((r) => (resolve = r)))
    const pending = store().toggleVerified(ADMIN_PLACES[1])
    expect(store().busy).toEqual({ [adminId('psicologia')]: true })
    expect(await store().toggleVerified(ADMIN_PLACES[1])).toBe(false) // no acepta un segundo envío
    await act(async () => {
      resolve({ place: ADMIN_PLACES[1], ragSync: 'ok' })
      await pending
    })
    expect(store().busy).toEqual({})
  })

  it('si falla, la fila vuelve a su estado, se avisa y no se refresca el mapa', async () => {
    api.saveAdminPlace.mockRejectedValue(new ApiError('network', 'x'))
    expect(await store().togglePublished(ADMIN_PLACES[0])).toBe(false)
    expect(store().places.find((p) => p.slug === 'fisi')!.isPublished).toBe(true)
    expect(store().busy).toEqual({})
    expect(toasts()).toContain('No se pudo guardar el cambio. Inténtalo de nuevo.')
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('aviso del asistente · RF-31.20', () => {
  const failed = { place: adminPlace('fisi', { name: 'FISI' }), ragSync: 'failed' as const }

  it('failed activa el aviso; ok y skipped no', async () => {
    api.saveAdminPlace.mockResolvedValue(failed)
    await store().save(adminId('fisi'), toInput(ADMIN_PLACES[0]))
    expect(store().ragWarning).toEqual({ placeId: adminId('fisi'), name: 'FISI' })
    api.saveAdminPlace.mockResolvedValue({ ...failed, ragSync: 'skipped' })
    await store().save(adminId('fisi'), toInput(ADMIN_PLACES[0]))
    expect(store().ragWarning).toBeNull()
  })

  it('«Reintentar» llama a reindex y cierra el aviso si responde ok', async () => {
    useAdminPlacesStore.setState({ ragWarning: { placeId: adminId('fisi'), name: 'FISI' } })
    api.reindexAdminPlace.mockResolvedValue({ place: ADMIN_PLACES[0], ragSync: 'ok' })
    await store().retryReindex()
    expect(api.reindexAdminPlace).toHaveBeenCalledWith(adminId('fisi'))
    expect(store().ragWarning).toBeNull()
  })

  it('si sigue fallando, el aviso permanece', async () => {
    useAdminPlacesStore.setState({ ragWarning: { placeId: adminId('fisi'), name: 'FISI' } })
    api.reindexAdminPlace.mockResolvedValue({ place: ADMIN_PLACES[0], ragSync: 'failed' })
    await store().retryReindex()
    expect(store().ragWarning).not.toBeNull()
    api.reindexAdminPlace.mockRejectedValue(new ApiError('network', 'x'))
    await store().retryReindex()
    expect(store().ragWarning).not.toBeNull()
  })
})
