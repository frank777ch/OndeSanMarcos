import { useToastStore } from '@/components/Toast/toastStore'
import { ApiError } from '@/services/api/client'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import { ADMIN_CATEGORIES } from '@/test/fixtures/adminPlaces'
import { useAdminCategoriesStore } from './useAdminCategoriesStore'

const api = vi.hoisted(() => ({
  listAdminCategories: vi.fn(),
  saveAdminCategory: vi.fn(),
  deleteAdminCategory: vi.fn(),
}))
vi.mock('@/services/api/adminPlacesApi', () => api)

const refresh = vi.fn()
const store = () => useAdminCategoriesStore.getState()

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset())
  refresh.mockReset()
  usePlacesStore.setState({ refresh })
  useToastStore.setState({ toasts: [] })
  useAdminCategoriesStore.setState({ status: 'ready', categories: [...ADMIN_CATEGORIES] })
})

describe('useAdminCategoriesStore · RF-31.28 a RF-31.32', () => {
  it('load: loading → ready, y error si falla; en silencio conserva la tabla', async () => {
    api.listAdminCategories.mockResolvedValue([ADMIN_CATEGORIES[0]])
    const pending = store().load()
    expect(store().status).toBe('loading')
    await pending
    expect(store()).toMatchObject({ status: 'ready', categories: [ADMIN_CATEGORIES[0]] })
    api.listAdminCategories.mockRejectedValue(new ApiError('network', 'x'))
    await store().load({ quiet: true })
    expect(store().status).toBe('ready')
    await store().load()
    expect(store().status).toBe('error')
  })

  it('save crea o edita, deja la lista ordenada, avisa y refresca el mapa público', async () => {
    api.saveAdminCategory.mockResolvedValue({ id: 'labs', label: 'Laboratorios', color: '#112233', sortOrder: 1, placesCount: 0 })
    await store().save(null, { id: 'labs', label: 'Laboratorios', color: '#112233', sortOrder: 1 })
    expect(store().categories.map((c) => c.id)).toEqual(['facultades', 'labs', 'puertas', 'vacia'])
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain('Categoría guardada')
    expect(refresh).toHaveBeenCalledTimes(1)
    api.saveAdminCategory.mockResolvedValue({ ...ADMIN_CATEGORIES[1], label: 'Accesos' })
    await store().save('puertas', { label: 'Accesos', color: '#e74c3c', sortOrder: null })
    expect(store().categories.filter((c) => c.id === 'puertas')).toHaveLength(1)
    expect(store().categories.find((c) => c.id === 'puertas')!.label).toBe('Accesos')
  })

  it('un error al guardar se propaga y no cambia la lista', async () => {
    api.saveAdminCategory.mockRejectedValue(new ApiError('http', 'x', 409, undefined, { detail: [] }))
    await expect(store().save(null, { id: 'a', label: 'A', color: '#111111', sortOrder: null })).rejects.toMatchObject({ status: 409 })
    expect(store().categories).toEqual(ADMIN_CATEGORIES)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('remove borra de la lista y refresca; un error no la toca', async () => {
    api.deleteAdminCategory.mockResolvedValue(undefined)
    await store().remove('vacia')
    expect(store().categories.map((c) => c.id)).not.toContain('vacia')
    expect(refresh).toHaveBeenCalledTimes(1)
    api.deleteAdminCategory.mockRejectedValue(new ApiError('http', 'x', 409))
    await expect(store().remove('puertas')).rejects.toMatchObject({ status: 409 })
    expect(store().categories.map((c) => c.id)).toContain('puertas')
  })
})
