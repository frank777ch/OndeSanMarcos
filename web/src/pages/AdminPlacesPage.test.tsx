import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToastStore } from '@/components/Toast/toastStore'
import { useAdminCategoriesStore } from '@/features/admin/categories/store/useAdminCategoriesStore'
import { useAdminPlacesStore } from '@/features/admin/places/store/useAdminPlacesStore'
import { EMPTY_FILTERS } from '@/features/admin/places/utils/filters'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import { ApiError } from '@/services/api/client'
import { ADMIN_CATEGORIES, ADMIN_PLACES, adminPlace } from '@/test/fixtures/adminPlaces'
import { AdminPlacesPage } from './AdminPlacesPage'

const api = vi.hoisted(() => ({
  listAdminPlaces: vi.fn(),
  listAdminCategories: vi.fn(),
  saveAdminPlace: vi.fn(),
  reindexAdminPlace: vi.fn(),
}))
vi.mock('@/services/api/adminPlacesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminPlacesApi')>()),
  ...api,
}))
vi.mock('@/features/admin/places/components/LocationPicker', () => ({
  LocationPicker: () => <div data-testid="picker" />,
}))

const refresh = vi.fn()
const toasts = () => useToastStore.getState().toasts.map((t) => t.message)
const rowOf = (name: string) => screen.getByRole('row', { name: new RegExp(name) })

async function renderPage(places = ADMIN_PLACES) {
  api.listAdminPlaces.mockResolvedValue(places)
  render(<AdminPlacesPage />)
  // Sin lugares no hay tabla: se espera a que termine de cargar (aparece el buscador).
  await screen.findByLabelText('Buscar')
}

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset())
  api.listAdminCategories.mockResolvedValue(ADMIN_CATEGORIES)
  refresh.mockReset()
  usePlacesStore.setState({ refresh })
  useToastStore.setState({ toasts: [] })
  useAdminCategoriesStore.setState({ status: 'idle', categories: [] })
  useAdminPlacesStore.setState({ status: 'idle', places: [], filters: EMPTY_FILTERS, page: 1, busy: {}, ragWarning: null })
})

describe('AdminPlacesPage · lista (RF-31.2, RF-31.3)', () => {
  it('RF-31.3: muestra «Cargando…» y luego la tabla', async () => {
    api.listAdminPlaces.mockResolvedValue(ADMIN_PLACES)
    render(<AdminPlacesPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando lugares…')
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('RF-31.2: todos los lugares (también los ocultos) con sus columnas, y el total', async () => {
    await renderPage()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Nombre', 'Categoría', 'Estado', 'Verificación', 'Última modificación', 'Acciones',
    ])
    expect(screen.getAllByRole('row')).toHaveLength(4) // encabezado + 3
    const fisi = rowOf('Ingeniería de Sistemas')
    expect(within(fisi).getByText('Facultades')).toBeInTheDocument()
    expect(within(fisi).getByText('Publicado')).toBeInTheDocument()
    expect(within(fisi).getByText('Verificado')).toBeInTheDocument()
    expect(within(fisi).getByText(/FISI · id fisi/)).toBeInTheDocument()
    const puerta = rowOf('Puerta 3')
    expect(within(puerta).getByText('Oculto')).toBeInTheDocument()
    expect(within(puerta).getByText('Sin verificar')).toBeInTheDocument()
    expect(screen.getByText('3 de 3 lugares')).toBeInTheDocument()
  })

  it('RF-31.3: si falla, mensaje claro con «Reintentar», que vuelve a pedir', async () => {
    api.listAdminPlaces.mockRejectedValueOnce(new ApiError('network', 'x'))
    render(<AdminPlacesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los lugares')
    api.listAdminPlaces.mockResolvedValue(ADMIN_PLACES)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('al volver con la tabla ya cargada se refresca sin mostrar «Cargando»', async () => {
    useAdminPlacesStore.setState({ status: 'ready', places: ADMIN_PLACES })
    useAdminCategoriesStore.setState({ status: 'ready', categories: ADMIN_CATEGORIES })
    api.listAdminPlaces.mockResolvedValue([ADMIN_PLACES[0]])
    render(<AdminPlacesPage />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText('Cargando lugares…')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('1 de 1 lugares')).toBeInTheDocument())
  })
})

describe('AdminPlacesPage · búsqueda y filtros (RF-31.4 a RF-31.6)', () => {
  it('la búsqueda filtra al instante, sin tildes ni mayúsculas, y actualiza el contador', async () => {
    await renderPage()
    await userEvent.type(screen.getByLabelText('Buscar'), 'PSICOLOGIA')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('1 de 3 lugares')).toBeInTheDocument()
  })

  it('filtra por categoría, estado y verificación y los combina', async () => {
    await renderPage()
    await userEvent.selectOptions(screen.getByLabelText('Verificación'), 'no')
    expect(screen.getByText('2 de 3 lugares')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'yes')
    expect(screen.getByText('1 de 3 lugares')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Psicología/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('combobox', { name: 'Categoría' }))
    await userEvent.click(screen.getByRole('option', { name: 'Puertas' }))
    expect(screen.getByText('0 de 3 lugares')).toBeInTheDocument()
  })

  it('RF-31.5: sin resultados muestra el mensaje y «Limpiar filtros» los quita', async () => {
    await renderPage()
    await userEvent.type(screen.getByLabelText('Buscar'), 'xyz')
    expect(screen.getByText('No hay lugares con esos filtros')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getAllByRole('row')).toHaveLength(4)
    expect(screen.getByLabelText('Buscar')).toHaveValue('')
  })

  it('RF-31.5: sin ningún lugar ofrece «Nuevo lugar»', async () => {
    await renderPage([])
    expect(screen.getByText('Todavía no hay lugares.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Nuevo lugar' })).toHaveLength(2)
  })

  it('RF-31.6: los filtros se conservan después de guardar un cambio', async () => {
    await renderPage()
    await userEvent.selectOptions(screen.getByLabelText('Verificación'), 'no')
    api.saveAdminPlace.mockResolvedValue({ place: { ...ADMIN_PLACES[1], verifiedAt: '2026-11-12T00:00:00Z' }, ragSync: 'ok' })
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como verificado Facultad de Psicología' }))
    await waitFor(() => expect(toasts()).toContain('Lugar verificado'))
    expect(screen.getByLabelText('Verificación')).toHaveValue('no')
    expect(screen.queryByRole('row', { name: /Psicología/ })).not.toBeInTheDocument()
  })
})

describe('AdminPlacesPage · paginación (RF-31.6a)', () => {
  const many = Array.from({ length: 54 }, (_, i) =>
    adminPlace(`p${String(i).padStart(2, '0')}`, { name: `Lugar ${String(i).padStart(2, '0')}` }),
  )

  it('20 por página, con rango y página; «Siguiente» avanza', async () => {
    await renderPage(many)
    expect(screen.getAllByRole('row')).toHaveLength(21)
    expect(screen.getByText('1–20 de 54 · Página 1 de 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText('21–40 de 54 · Página 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Lugar 20/ })).toBeInTheDocument()
  })

  it('al cambiar la búsqueda vuelve a la página 1', async () => {
    await renderPage(many)
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    await userEvent.type(screen.getByLabelText('Buscar'), 'Lugar 4')
    expect(screen.getByText('10 de 54 lugares')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
  })

  it('con una sola página no hay controles', async () => {
    await renderPage()
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
  })
})

describe('AdminPlacesPage · acciones de fila (RF-31.7 a RF-31.10)', () => {
  it('RF-31.7: despublicar pide confirmación y solo guarda si se confirma', async () => {
    await renderPage()
    api.saveAdminPlace.mockResolvedValue({ place: { ...ADMIN_PLACES[1], isPublished: false }, ragSync: 'ok' })
    await userEvent.click(screen.getByRole('button', { name: 'Despublicar Facultad de Psicología' }))
    const dialog = screen.getByRole('dialog', { name: '¿Despublicar este lugar?' })
    expect(dialog).toHaveTextContent('dejará de verse en el mapa y en el asistente')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(api.saveAdminPlace).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Despublicar Facultad de Psicología' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Despublicar' }))
    await waitFor(() => expect(within(rowOf('Psicología')).getByText('Oculto')).toBeInTheDocument())
    expect(api.saveAdminPlace).toHaveBeenCalledWith('psicologia', expect.objectContaining({ isPublished: false, name: 'Facultad de Psicología' }))
    expect(toasts()).toContain('Lugar despublicado')
    expect(refresh).toHaveBeenCalled()
  })

  it('RF-31.7: publicar un lugar oculto no pide confirmación', async () => {
    await renderPage()
    api.saveAdminPlace.mockResolvedValue({ place: { ...ADMIN_PLACES[2], isPublished: true }, ragSync: 'ok' })
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Puerta 3' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(within(rowOf('Puerta 3')).getByText('Publicado')).toBeInTheDocument())
  })

  it('RF-31.8 y RF-31.9: verificar y quitar la verificación envían el lugar completo sin abrir el diálogo', async () => {
    await renderPage()
    const fisi = ADMIN_PLACES[0]
    api.saveAdminPlace.mockResolvedValue({ place: { ...fisi, verifiedAt: null }, ragSync: 'ok' })
    await userEvent.click(screen.getByRole('button', { name: /^Quitar verificación de Facultad de Ingeniería/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.saveAdminPlace).toHaveBeenCalledWith('fisi', expect.objectContaining({
      verified: false, phone: '619-7000', careers: ['Ingeniería de Software'], keywords: ['informática', 'software'],
      shortName: 'FISI', lat: fisi.lat, isPublished: true,
    }))
    await waitFor(() => expect(within(rowOf('Ingeniería de Sistemas')).getByText('Sin verificar')).toBeInTheDocument())
  })

  it('RF-31.10: la fila queda deshabilitada mientras guarda', async () => {
    await renderPage()
    let resolve!: (v: unknown) => void
    api.saveAdminPlace.mockReturnValue(new Promise((r) => (resolve = r)))
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como verificado Facultad de Psicología' }))
    for (const button of within(rowOf('Psicología')).getAllByRole('button')) expect(button).toBeDisabled()
    expect(within(rowOf('Puerta 3')).getAllByRole('button')[0]).toBeEnabled()
    await act(async () => resolve({ place: ADMIN_PLACES[1], ragSync: 'ok' }))
    expect(within(rowOf('Psicología')).getAllByRole('button')[0]).toBeEnabled()
  })

  it('RF-31.10: si falla, la fila vuelve a su estado y se avisa', async () => {
    await renderPage()
    api.saveAdminPlace.mockRejectedValue(new ApiError('network', 'x'))
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como verificado Facultad de Psicología' }))
    await waitFor(() => expect(toasts()).toContain('No se pudo guardar el cambio. Inténtalo de nuevo.'))
    expect(within(rowOf('Psicología')).getByText('Sin verificar')).toBeInTheDocument()
    expect(within(rowOf('Psicología')).getAllByRole('button')[0]).toBeEnabled()
  })

  it('RF-31.35: cada botón de fila nombra el lugar', async () => {
    await renderPage()
    const labels = within(rowOf('Puerta 3')).getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(labels).toEqual(['Editar Puerta 3', 'Publicar Puerta 3', 'Marcar como verificado Puerta 3'])
  })
})

describe('AdminPlacesPage · crear y editar (RF-31.11, RF-31.16, RF-31.20)', () => {
  it('«Nuevo lugar» abre el diálogo de creación y «Editar» el de edición', async () => {
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo lugar' }))
    expect(await screen.findByRole('dialog', { name: 'Nuevo lugar' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Editar Puerta 3' }))
    expect(await screen.findByRole('dialog', { name: 'Editar lugar' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveValue('Puerta 3')
  })

  it('al cerrar el diálogo el foco vuelve al botón que lo abrió', async () => {
    await renderPage()
    const open = screen.getByRole('button', { name: 'Editar Puerta 3' })
    await userEvent.click(open)
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(open).toHaveFocus()
  })

  it('crear un lugar lo agrega a la tabla', async () => {
    await renderPage()
    api.saveAdminPlace.mockResolvedValue({ place: adminPlace('1000', { name: 'Zeta' }), ragSync: 'ok' })
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo lugar' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(screen.getByLabelText(/^Nombre \*/), 'Zeta')
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Categoría/ }))
    await userEvent.click(screen.getByRole('option', { name: 'Facultades' }))
    await userEvent.type(screen.getByLabelText(/^Latitud/), '-12.0535')
    await userEvent.type(screen.getByLabelText(/^Longitud/), '-77.0857')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('row', { name: /Zeta/ })).toBeInTheDocument()
    expect(screen.getByText('4 de 4 lugares')).toBeInTheDocument()
  })

  it('RF-31.20: con rag_sync failed aparece el aviso y «Reintentar» llama a reindex', async () => {
    await renderPage()
    api.saveAdminPlace.mockResolvedValue({ place: { ...ADMIN_PLACES[1], verifiedAt: '2026-11-12T00:00:00Z' }, ragSync: 'failed' })
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como verificado Facultad de Psicología' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('El lugar «Facultad de Psicología» se guardó, pero el asistente aún no lo conoce.')
    api.reindexAdminPlace.mockResolvedValue({ place: ADMIN_PLACES[1], ragSync: 'ok' })
    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))
    expect(api.reindexAdminPlace).toHaveBeenCalledWith('psicologia')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('RF-31.20: con ok o skipped no aparece ningún aviso', async () => {
    await renderPage()
    api.saveAdminPlace.mockResolvedValue({ place: ADMIN_PLACES[1], ragSync: 'skipped' })
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como verificado Facultad de Psicología' }))
    await waitFor(() => expect(toasts()).toContain('Lugar verificado'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
