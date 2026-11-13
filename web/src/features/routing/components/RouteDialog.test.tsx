import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocationStore } from '../../map/store/useLocationStore'
import { useMapStore } from '../../map/store/useMapStore'
import { useRouteStore } from '../store/useRouteStore'
import { RouteButton } from './RouteButton'
import { RouteDialog } from './RouteDialog'
import { seedPlaces } from '@/test/fixtures/places'

const from = () => screen.getByRole('combobox', { name: 'Punto de partida' })
const to = () => screen.getByRole('combobox', { name: 'Destino' })

async function pick(box: HTMLElement, text: string, option: RegExp | string) {
  await userEvent.type(box, text)
  await userEvent.click(screen.getByRole('option', { name: option }))
}

function setup() {
  render(
    <>
      <RouteButton />
      <RouteDialog />
    </>,
  )
}

describe('RouteDialog', () => {
  beforeEach(() => {
    seedPlaces()
    useRouteStore.setState({ open: false, origin: null, destination: null, status: 'idle', result: null, activeRoute: null, notice: null })
    useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
    useLocationStore.setState({ permission: 'granted', position: null, locating: false })
  })

  it('RF-13.2, RF-13.4, RF-13.35: el botón abre el diálogo con dos campos vacíos y el foco en el primero', async () => {
    setup()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    const dialog = screen.getByRole('dialog', { name: 'Planificar ruta' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const fields = within(dialog).getAllByRole('combobox')
    expect(fields.map((f) => f.getAttribute('aria-label'))).toEqual(['Punto de partida', 'Destino'])
    expect(fields[0]).toHaveValue('')
    expect(fields[1]).toHaveValue('')
    expect(fields[0]).toHaveFocus()
  })

  it('RF-13.46: el diálogo de ruta es un panel que sale desde arriba en móvil', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    expect(screen.getByRole('dialog', { name: 'Planificar ruta' })).toHaveAttribute('data-sheet', 'top')
  })

  it('RF-13.3 y RF-13.4: Esc cierra y el foco vuelve al botón; con la lista abierta Esc solo la cierra', async () => {
    setup()
    const button = screen.getByRole('button', { name: 'Planificar ruta' })
    await userEvent.click(button)
    await userEvent.type(from(), 'puerta')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('RF-13.2: «Cerrar» cierra el diálogo', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-13.8, RF-13.9, RF-13.19, RF-13.28, RF-13.29: elegir dos lugares muestra la distancia y no toca el mapa', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    await pick(from(), 'biblioteca', /Biblioteca Central/)
    await pick(to(), 'puerta 3', /Puerta 3/)
    const result = await screen.findByText(/\d+(,\d)? (m|km)/)
    expect(result.closest('[role="status"]')).toHaveTextContent('Biblioteca Central Pedro Zulen → Puerta 3')
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
  })

  it('RF-13.10, RF-13.11, RF-13.30: limpiar o editar quita el resultado', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    await pick(from(), 'biblioteca', /Biblioteca Central/)
    await pick(to(), 'puerta 3', /Puerta 3/)
    await screen.findByText(/\d+(,\d)? (m|km)/)
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar destino' }))
    expect(to()).toHaveValue('')
    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
    await pick(to(), 'puerta 3', /Puerta 3/)
    await screen.findByText(/→/)
    await userEvent.type(from(), 'x')
    expect(useRouteStore.getState().origin).toBeNull()
    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\d (m|km)/)).not.toBeInTheDocument()
  })

  it('RF-13.13: el mismo lugar avisa y no calcula', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    await pick(from(), 'puerta 3', /Puerta 3/)
    await pick(to(), 'puerta 3', /Puerta 3/)
    expect(await screen.findByRole('alert')).toHaveTextContent('El punto de partida y el destino son el mismo lugar')
  })

  it('RF-13.12: «Intercambiar» cambia partida y destino', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    await pick(from(), 'biblioteca', /Biblioteca Central/)
    await pick(to(), 'puerta 3', /Puerta 3/)
    await userEvent.click(screen.getByRole('button', { name: 'Intercambiar' }))
    expect(from()).toHaveValue('Puerta 3')
    expect(to()).toHaveValue('Biblioteca Central Pedro Zulen')
  })

  it('RF-13.6: al cerrar y abrir conserva los campos', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    await pick(from(), 'biblioteca', /Biblioteca Central/)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    expect(from()).toHaveValue('Biblioteca Central Pedro Zulen')
  })

  it('RF-13.37: «Iniciar ruta» está deshabilitado sin ruta válida y se habilita con ella', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    const start = screen.getByRole('button', { name: 'Iniciar ruta' })
    expect(start).toBeDisabled()
    await pick(from(), 'puerta 3', /Puerta 3/)
    await pick(to(), 'puerta 3', /Puerta 3/)
    await screen.findByRole('alert')
    expect(start).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar destino' }))
    await pick(to(), 'biblioteca', /Biblioteca Central/)
    await screen.findByText(/→/)
    expect(start).toBeEnabled()
  })

  it('RF-13.38, RF-13.41: iniciar cierra el diálogo y guarda la ruta; «Quitar ruta» la borra', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    expect(screen.queryByRole('button', { name: 'Quitar ruta' })).not.toBeInTheDocument()
    await pick(from(), 'puerta 3', /Puerta 3/)
    await pick(to(), 'biblioteca', /Biblioteca Central/)
    await screen.findByText(/→/)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar ruta' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useRouteStore.getState().activeRoute).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    expect(from()).toHaveValue('Puerta 3')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar ruta' }))
    expect(useRouteStore.getState().activeRoute).toBeNull()
    expect(from()).toHaveValue('Puerta 3')
    expect(screen.queryByRole('button', { name: 'Quitar ruta' })).not.toBeInTheDocument()
  })

  describe('mi ubicación', () => {
    const locate = vi.fn()
    beforeEach(() => {
      locate.mockReset()
      useLocationStore.setState({ locate })
    })

    it('RF-13.14: «Mi ubicación» solo se ofrece en la partida', async () => {
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
      await userEvent.click(from())
      expect(screen.getByRole('option', { name: 'Mi ubicación' })).toBeInTheDocument()
      await userEvent.click(to())
      expect(screen.queryByRole('option', { name: 'Mi ubicación' })).not.toBeInTheDocument()
    })

    it('RF-13.15: elegirla usa la ubicación y el campo la muestra', async () => {
      locate.mockResolvedValue({ coordinates: [-77.0827, -12.0565], accuracy: 5 })
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
      await userEvent.click(from())
      await userEvent.click(screen.getByRole('option', { name: 'Mi ubicación' }))
      expect(from()).toHaveValue('Mi ubicación')
      await pick(to(), 'puerta 3', /Puerta 3/)
      expect(await screen.findByText(/→/)).toHaveTextContent('Mi ubicación → Puerta 3')
    })

    it('RF-13.16: mientras se obtiene muestra el indicador y bloquea el campo', async () => {
      locate.mockReturnValue(new Promise(() => {}))
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
      await userEvent.click(from())
      await userEvent.click(screen.getByRole('option', { name: 'Mi ubicación' }))
      expect(screen.getByRole('status')).toHaveTextContent('Obteniendo tu ubicación')
      expect(from()).toBeDisabled()
    })

    it('RF-13.17: sin permiso el campo queda vacío y explica por qué', async () => {
      useLocationStore.setState({ permission: 'denied' })
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
      await userEvent.click(from())
      await userEvent.click(screen.getByRole('option', { name: 'Mi ubicación' }))
      expect(screen.getByRole('alert')).toHaveTextContent('No podemos usar tu ubicación')
      expect(from()).toHaveValue('')
      expect(locate).not.toHaveBeenCalled()
    })

    it('RF-13.23: lejos del campus avisa que el punto de partida no tiene camino', async () => {
      locate.mockResolvedValue({ coordinates: [-77.03, -12.0], accuracy: 5 })
      setup()
      await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
      await userEvent.click(from())
      await userEvent.click(screen.getByRole('option', { name: 'Mi ubicación' }))
      await pick(to(), 'puerta 3', /Puerta 3/)
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('Estás muy lejos de los caminos del campus')
      expect(alert).toHaveTextContent('punto de partida')
    })
  })
})
