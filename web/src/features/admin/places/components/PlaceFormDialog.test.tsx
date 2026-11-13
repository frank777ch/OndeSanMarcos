import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToastStore } from '@/components/Toast/toastStore'
import { ApiError } from '@/services/api/client'
import { ADMIN_CATEGORIES, ADMIN_PLACES, adminPlace } from '@/test/fixtures/adminPlaces'
import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import { useAdminCategoriesStore } from '../../categories/store/useAdminCategoriesStore'
import { useAdminPlacesStore } from '../store/useAdminPlacesStore'
import { EMPTY_FILTERS } from '../utils/filters'
import { PlaceFormDialog } from './PlaceFormDialog'

const api = vi.hoisted(() => ({ saveAdminPlace: vi.fn(), listAdminCategories: vi.fn() }))
vi.mock('@/services/api/adminPlacesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminPlacesApi')>()),
  ...api,
}))
// El mapa real necesita WebGL: se sustituye por un botón que «hace clic» en un punto.
vi.mock('./LocationPicker', () => ({
  LocationPicker: (props: { lat: number | null; lng: number | null; editingId?: string | null; contextPlaces: unknown[]; onPick: (a: number, b: number) => void }) => (
    <div data-testid="picker" data-lat={props.lat ?? ''} data-lng={props.lng ?? ''} data-editing={props.editingId ?? ''} data-context={props.contextPlaces.length}>
      <button type="button" onClick={() => props.onPick(-12.0565, -77.0827)}>
        Elegir punto
      </button>
    </div>
  ),
}))

const onClose = vi.fn()

async function renderDialog(place = null as (typeof ADMIN_PLACES)[number] | null) {
  render(<PlaceFormDialog place={place} onClose={onClose} />)
  await screen.findByTestId('picker')
}
const type = (label: RegExp, value: string) => userEvent.type(screen.getByLabelText(label), value)
const chooseCategory = async (name: string) => {
  await userEvent.click(screen.getByRole('combobox', { name: /Categoría/ }))
  await userEvent.click(screen.getByRole('option', { name }))
}
async function fillRequired() {
  await type(/^Nombre \*/, 'Laboratorio')
  await chooseCategory('Facultades')
  await userEvent.click(screen.getByRole('button', { name: 'Elegir punto' }))
}
const save = () => screen.getByRole('button', { name: /^Guardar|Guardando/ })

beforeEach(() => {
  onClose.mockReset()
  api.saveAdminPlace.mockReset()
  api.listAdminCategories.mockResolvedValue(ADMIN_CATEGORIES)
  useToastStore.setState({ toasts: [] })
  usePlacesStore.setState({ refresh: vi.fn() })
  useAdminCategoriesStore.setState({ status: 'ready', categories: ADMIN_CATEGORIES })
  useAdminPlacesStore.setState({ status: 'ready', places: ADMIN_PLACES, filters: EMPTY_FILTERS, page: 1, busy: {}, ragWarning: null })
})

describe('PlaceFormDialog · diálogo (RF-31.11, RF-31.12)', () => {
  it('crear: título «Nuevo lugar», por encima de todo y con el fondo difuminado', async () => {
    await renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Nuevo lugar' })
    expect(dialog.parentElement).toHaveClass('z-[1000]', 'backdrop-blur-sm', 'fixed', 'inset-0')
  })

  it('editar: título «Editar lugar», datos cargados e id de solo lectura', async () => {
    await renderDialog(ADMIN_PLACES[0])
    expect(screen.getByRole('dialog', { name: 'Editar lugar' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveValue('Facultad de Ingeniería de Sistemas e Informática')
    expect(screen.getByLabelText('Nombre corto o sigla')).toHaveValue('FISI')
    expect(screen.getByRole('combobox', { name: /Categoría/ })).toHaveValue('Facultades')
    expect(screen.getByLabelText('Palabras clave')).toHaveValue('informática\nsoftware')
    expect(screen.getByLabelText(/Verificado/)).toBeChecked()
    expect(screen.getByText('fisi')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Id/)).not.toBeInTheDocument()
  })

  it('se cierra con la X y con Esc cuando no hay cambios', async () => {
    await renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('el foco entra en el primer campo', async () => {
    await renderDialog()
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveFocus()
  })

  it('RF-31.13: tiene todas las secciones y campos de la ficha, y no pide el id al crear', async () => {
    await renderDialog()
    const legends = Array.from(document.querySelectorAll('legend')).map((l) => l.textContent)
    expect(legends).toEqual(['Datos', 'Ubicación', 'Horario', 'Contacto', 'Descripción', 'Listas', 'Lugar que lo contiene'])
    for (const label of [
      /^Nombre \*/, 'Nombre corto o sigla', 'Latitud *', 'Longitud *', 'Horario (resumen)', 'Detalle del horario',
      'Teléfono', 'Anexo', 'Correo', 'Página web', 'Descripción', 'Cómo encontrarlo', 'Para qué se usa',
      'Palabras clave', 'Carreras', 'Servicios',
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByRole('combobox', { name: /Lugar que lo contiene/ })).toBeInTheDocument()
    expect(screen.queryByText(/^Id:/)).not.toBeInTheDocument()
  })
})

describe('PlaceFormDialog · campos (RF-31.14, RF-31.15)', () => {
  it('RF-31.15: Guardar está deshabilitado hasta completar nombre, categoría y coordenadas', async () => {
    await renderDialog()
    expect(save()).toBeDisabled()
    await type(/^Nombre \*/, 'Lab')
    expect(save()).toBeDisabled()
    await chooseCategory('Facultades')
    expect(save()).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Elegir punto' }))
    expect(save()).toBeEnabled()
  })

  it('RF-31.15: los obligatorios están marcados', async () => {
    await renderDialog()
    for (const label of [/^Nombre \*/, /^Latitud/, /^Longitud/]) expect(screen.getByLabelText(label)).toBeRequired()
    expect(screen.getByRole('combobox', { name: /Categoría/ })).toBeRequired()
    expect(screen.getByLabelText('Teléfono')).not.toBeRequired()
  })

  it('RF-31.22: elegir un punto en el mapa llena latitud y longitud', async () => {
    await renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Elegir punto' }))
    expect(screen.getByLabelText(/^Latitud/)).toHaveValue('-12.0565')
    expect(screen.getByLabelText(/^Longitud/)).toHaveValue('-77.0827')
    expect(screen.getByTestId('picker')).toHaveAttribute('data-lat', '-12.0565')
  })

  it('RF-31.23: escribir coordenadas mueve el marcador; un valor fuera del área o no numérico avisa', async () => {
    await renderDialog()
    await type(/^Latitud/, '-12.0535')
    await type(/^Longitud/, '-77.0857')
    expect(screen.getByTestId('picker')).toHaveAttribute('data-lat', '-12.0535')
    await userEvent.clear(screen.getByLabelText(/^Latitud/))
    await type(/^Latitud/, '40')
    expect(screen.getByText(/fuera del área del campus/)).toBeInTheDocument()
    expect(screen.getByTestId('picker')).toHaveAttribute('data-lat', '')
    await userEvent.clear(screen.getByLabelText(/^Latitud/))
    await type(/^Latitud/, 'abc')
    expect(screen.getByText('Debe ser un número.')).toBeInTheDocument()
    expect(save()).toBeDisabled()
  })

  it('RF-31.25/26: al editar el mapa parte de la posición del lugar y recibe el resto como contexto', async () => {
    await renderDialog(ADMIN_PLACES[0])
    const picker = screen.getByTestId('picker')
    expect(picker).toHaveAttribute('data-lat', String(ADMIN_PLACES[0].lat))
    expect(picker).toHaveAttribute('data-editing', 'fisi')
    expect(picker).toHaveAttribute('data-context', '3')
  })

  it('RF-31.14: la categoría solo admite valores de la lista', async () => {
    await renderDialog()
    await type(/^Nombre \*/, 'Lab')
    await userEvent.click(screen.getByRole('button', { name: 'Elegir punto' }))
    await userEvent.type(screen.getByRole('combobox', { name: /Categoría/ }), 'Inventada')
    await userEvent.tab()
    expect(screen.getByRole('combobox', { name: /Categoría/ })).toHaveValue('')
    expect(save()).toBeDisabled()
  })

  it('RF-31.14: el lugar contenedor excluye al propio lugar y a sus descendientes', async () => {
    useAdminPlacesStore.setState({
      places: [...ADMIN_PLACES, adminPlace('hijo', { name: 'Hijo', parentPlaceId: 'fisi' })],
    })
    await renderDialog(ADMIN_PLACES[0])
    await userEvent.click(screen.getByRole('combobox', { name: /Lugar que lo contiene/ }))
    const names = screen.getAllByRole('option').map((o) => o.textContent)
    expect(names.some((n) => n?.includes('Hijo'))).toBe(false)
    expect(names.some((n) => n?.includes('Ingeniería de Sistemas'))).toBe(false)
    expect(names.some((n) => n?.includes('Puerta 3'))).toBe(true)
  })
})

describe('PlaceFormDialog · guardar (RF-31.16 a RF-31.18)', () => {
  it('RF-31.16: crea con los datos del formulario, cierra y avisa', async () => {
    api.saveAdminPlace.mockResolvedValue({ place: adminPlace('1000', { name: 'Laboratorio' }), ragSync: 'ok' })
    await renderDialog()
    await fillRequired()
    await type(/^Palabras clave/, 'Redes{Enter} redes {Enter}Wifi')
    await type(/^Correo/, 'lab@unmsm.edu.pe')
    await userEvent.click(screen.getByLabelText(/Publicado/)) // se desmarca
    await userEvent.click(save())
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(api.saveAdminPlace).toHaveBeenCalledWith(null, expect.objectContaining({
      name: 'Laboratorio', categoryId: 'facultades', lat: -12.0565, lng: -77.0827,
      keywords: ['Redes', 'Wifi'], email: 'lab@unmsm.edu.pe', phone: null, isPublished: false, verified: false,
    }))
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain('Lugar guardado')
    expect(useAdminPlacesStore.getState().places.map((p) => p.id)).toContain('1000')
  })

  it('RF-31.16: editar reemplaza con PUT al id del lugar', async () => {
    api.saveAdminPlace.mockResolvedValue({ place: ADMIN_PLACES[1], ragSync: 'ok' })
    await renderDialog(ADMIN_PLACES[1])
    await type(/^Teléfono/, '123')
    await userEvent.click(save())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(api.saveAdminPlace).toHaveBeenCalledWith('psicologia', expect.objectContaining({ phone: '123', name: 'Facultad de Psicología' }))
  })

  it('RF-31.15: mientras guarda, Guardar queda deshabilitado y no admite un segundo envío', async () => {
    let resolve!: (v: unknown) => void
    api.saveAdminPlace.mockReturnValue(new Promise((r) => (resolve = r)))
    await renderDialog()
    await fillRequired()
    await userEvent.click(save())
    expect(save()).toBeDisabled()
    expect(save()).toHaveTextContent('Guardando…')
    await userEvent.click(save())
    expect(api.saveAdminPlace).toHaveBeenCalledTimes(1)
    await act(async () => resolve({ place: adminPlace('1000'), ragSync: 'ok' }))
  })

  it('RF-31.17: un 422 muestra el mensaje junto al campo, lleva el foco y no cierra ni pierde lo escrito', async () => {
    const detail = [{ loc: ['body', 'email'], msg: 'Value error, Debe ser un correo válido.' }]
    api.saveAdminPlace.mockRejectedValue(new ApiError('http', 'x', 422, undefined, { detail }))
    await renderDialog()
    await fillRequired()
    await type(/^Correo/, 'x')
    await userEvent.click(save())
    const email = screen.getByLabelText('Correo')
    await waitFor(() => expect(email).toHaveFocus())
    expect(email).toHaveAccessibleDescription('Debe ser un correo válido.')
    expect(screen.getByText('Revisa los campos marcados.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveValue('Laboratorio')
    // Al corregirlo el error de ese campo desaparece.
    await userEvent.type(email, 'x')
    expect(email).not.toHaveAccessibleDescription('Debe ser un correo válido.')
  })

  it('RF-31.17: un error de categoría inexistente se muestra en el selector', async () => {
    const detail = [{ loc: ['body', 'category_id'], msg: 'Value error, La categoría no existe.' }]
    api.saveAdminPlace.mockRejectedValue(new ApiError('http', 'x', 422, undefined, { detail }))
    await renderDialog()
    await fillRequired()
    await userEvent.click(save())
    expect(await screen.findByText('La categoría no existe.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('combobox', { name: /Categoría/ })).toHaveFocus())
  })

  it('RF-31.18: sin conexión muestra un mensaje dentro del diálogo y permite reintentar', async () => {
    api.saveAdminPlace.mockRejectedValueOnce(new ApiError('network', 'x'))
    api.saveAdminPlace.mockResolvedValueOnce({ place: adminPlace('1000'), ragSync: 'ok' })
    await renderDialog()
    await fillRequired()
    await userEvent.click(save())
    expect(await screen.findByText(/Revisa tu conexión/)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveValue('Laboratorio')
    await userEvent.click(save())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

describe('PlaceFormDialog · descartar cambios (RF-31.19)', () => {
  it('con cambios, la X pide confirmación dentro del diálogo; «Seguir editando» conserva lo escrito', async () => {
    await renderDialog()
    await type(/^Nombre \*/, 'Algo')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).not.toHaveBeenCalled()
    const confirm = screen.getByRole('alertdialog')
    expect(within(confirm).getByText('¿Descartar los cambios?')).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    await userEvent.click(within(confirm).getByRole('button', { name: 'Seguir editando' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveValue('Algo')
  })

  it('con cambios, Esc y «Cancelar» también preguntan, y «Descartar» cierra', async () => {
    await renderDialog()
    await type(/^Nombre \*/, 'Algo')
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}') // Esc con la pregunta abierta = seguir editando
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Descartar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sin cambios no pregunta, y editar un lugar y no tocarlo tampoco', async () => {
    await renderDialog(ADMIN_PLACES[0])
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
