import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToastStore } from '@/components/Toast/toastStore'
import { useAdminCategoriesStore } from '@/features/admin/categories/store/useAdminCategoriesStore'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import { ApiError } from '@/services/api/client'
import { ADMIN_CATEGORIES } from '@/test/fixtures/adminPlaces'
import { catId } from '@/test/fixtures/places'
import { AdminCategoriesPage } from './AdminCategoriesPage'

const api = vi.hoisted(() => ({
  listAdminCategories: vi.fn(),
  saveAdminCategory: vi.fn(),
  deleteAdminCategory: vi.fn(),
}))
vi.mock('@/services/api/adminPlacesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminPlacesApi')>()),
  ...api,
}))

const refresh = vi.fn()
const toasts = () => useToastStore.getState().toasts.map((t) => t.message)
const rowOf = (name: string) => screen.getByRole('row', { name: new RegExp(name) })
const apiError = (status: number, detail: unknown) => new ApiError('http', 'x', status, undefined, { detail })

async function renderPage() {
  api.listAdminCategories.mockResolvedValue(ADMIN_CATEGORIES)
  render(<AdminCategoriesPage />)
  await screen.findByRole('table')
}

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset())
  refresh.mockReset()
  usePlacesStore.setState({ refresh })
  useToastStore.setState({ toasts: [] })
  useAdminCategoriesStore.setState({ status: 'idle', categories: [] })
})

describe('AdminCategoriesPage · tabla (RF-31.28)', () => {
  it('muestra color, nombre, slug, orden y cantidad de lugares, por orden', async () => {
    await renderPage()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Color', 'Nombre', 'Slug', 'Orden', 'Lugares', 'Acciones',
    ])
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((r) => within(r).getByRole('rowheader').textContent)).toEqual(['Facultades', 'Puertas', 'Vacía'])
    expect(within(rowOf('Puertas')).getByText('puertas')).toBeInTheDocument()
    expect(within(rowOf('Facultades')).getByText('2 lugares')).toBeInTheDocument()
    expect(within(rowOf('Puertas')).getByText('1 lugar')).toBeInTheDocument()
    expect(within(rowOf('Vacía')).getByText('0 lugares')).toBeInTheDocument()
    expect(within(rowOf('Puertas')).getByRole('img', { name: 'Color #e74c3c' })).toBeInTheDocument()
  })

  it('carga y error con «Reintentar»', async () => {
    api.listAdminCategories.mockRejectedValueOnce(new ApiError('network', 'x'))
    render(<AdminCategoriesPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las categorías')
    api.listAdminCategories.mockResolvedValue(ADMIN_CATEGORIES)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})

describe('AdminCategoriesPage · crear y editar (RF-31.29, RF-31.30)', () => {
  it('«Nueva categoría» abre un diálogo por encima de todo, con fondo difuminado, título, X y Esc', async () => {
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    const dialog = screen.getByRole('dialog', { name: 'Nueva categoría' })
    expect(dialog.parentElement).toHaveClass('z-[1000]', 'backdrop-blur-sm')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('crear: Guardar espera nombre y color (sin campo de id); envía los datos y agrega la fila', async () => {
    await renderPage()
    api.saveAdminCategory.mockResolvedValue({ id: catId('labs'), slug: 'laboratorios', label: 'Laboratorios', color: '#112233', sortOrder: 3, placesCount: 0 })
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    const save = screen.getByRole('button', { name: 'Guardar' })
    expect(save).toBeDisabled()
    expect(screen.queryByLabelText(/^Id/)).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Laboratorios')
    await userEvent.clear(screen.getByLabelText(/^Color \*/))
    await userEvent.type(screen.getByLabelText(/^Color \*/), '#112233')
    expect(save).toBeEnabled()
    await userEvent.click(save)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(api.saveAdminCategory).toHaveBeenCalledWith(null, { label: 'Laboratorios', color: '#112233', sortOrder: null })
    expect(rowOf('Laboratorios')).toBeInTheDocument()
    expect(toasts()).toContain('Categoría guardada')
    expect(refresh).toHaveBeenCalled()
  })

  it('el selector de color y el texto #RRGGBB están sincronizados', async () => {
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    const text = screen.getByLabelText(/^Color \*/)
    await userEvent.clear(text)
    await userEvent.type(text, '#00ff00')
    expect(screen.getByLabelText('Elegir color')).toHaveValue('#00ff00')
    await userEvent.clear(text)
    await userEvent.type(text, 'rojo')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('editar: título «Editar categoría», id y slug de solo lectura, y envía PUT sin ellos', async () => {
    await renderPage()
    api.saveAdminCategory.mockResolvedValue({ ...ADMIN_CATEGORIES[1], label: 'Accesos' })
    await userEvent.click(screen.getByRole('button', { name: 'Editar Puertas' }))
    expect(screen.getByRole('dialog', { name: 'Editar categoría' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Id/)).not.toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText('puertas')).toBeInTheDocument() // slug, solo lectura
    await userEvent.clear(screen.getByLabelText(/^Nombre/))
    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Accesos')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(api.saveAdminCategory).toHaveBeenCalledWith(catId('puertas'), { label: 'Accesos', color: '#e74c3c', sortOrder: 1 })
    expect(rowOf('Accesos')).toBeInTheDocument()
  })

  it('RF-31.30: un error del nombre se muestra junto al campo sin cerrar ni perder lo escrito', async () => {
    await renderPage()
    api.saveAdminCategory.mockRejectedValue(apiError(422, [{ loc: ['body', 'label'], msg: 'Nombre no válido.' }]))
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Otra')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Nombre no válido.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^Nombre/)).toHaveFocus())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Otra')
  })

  it('RF-31.30: un 422 de color se muestra junto al campo; sin conexión, un mensaje general', async () => {
    await renderPage()
    api.saveAdminCategory.mockRejectedValueOnce(apiError(422, [{ loc: ['body', 'color'], msg: 'Value error, Debe tener el formato #RRGGBB.' }]))
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Nueva')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Debe tener el formato #RRGGBB.')).toBeInTheDocument()
    api.saveAdminCategory.mockRejectedValueOnce(new ApiError('network', 'x'))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/Revisa tu conexión/)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('RF-31.19: con cambios, la X pide confirmación; «Descartar» cierra', async () => {
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Nueva categoría' }))
    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Algo')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    const confirm = screen.getByRole('alertdialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Seguir editando' }))
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Algo')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Descartar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('AdminCategoriesPage · borrar (RF-31.31)', () => {
  it('con lugares, «Borrar» está deshabilitado e indica cuántos tiene', async () => {
    await renderPage()
    const button = screen.getByRole('button', { name: 'Borrar Facultades (tiene 2 lugares)' })
    expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Borrar Puertas (tiene 1 lugar)' })).toBeDisabled()
  })

  it('una categoría vacía pide confirmación y se borra', async () => {
    await renderPage()
    api.deleteAdminCategory.mockResolvedValue(undefined)
    await userEvent.click(screen.getByRole('button', { name: 'Borrar Vacía' }))
    const dialog = screen.getByRole('dialog', { name: '¿Borrar esta categoría?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(api.deleteAdminCategory).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Borrar Vacía' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar' }))
    await waitFor(() => expect(screen.queryByRole('row', { name: /Vacía/ })).not.toBeInTheDocument())
    expect(api.deleteAdminCategory).toHaveBeenCalledWith(catId('vacia'))
    expect(toasts()).toContain('Categoría borrada')
    expect(refresh).toHaveBeenCalled()
  })

  it('si el servidor responde 409 igualmente, muestra el motivo y refresca la lista', async () => {
    await renderPage()
    api.deleteAdminCategory.mockRejectedValue(apiError(409, 'No se puede borrar: la categoría tiene 1 lugar.'))
    api.listAdminCategories.mockResolvedValue([{ ...ADMIN_CATEGORIES[2], placesCount: 1 }])
    await userEvent.click(screen.getByRole('button', { name: 'Borrar Vacía' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar' }))
    await waitFor(() => expect(toasts()).toContain('No se puede borrar: la categoría tiene 1 lugar.'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Borrar Vacía (tiene 1 lugar)' })).toBeDisabled())
  })
})
