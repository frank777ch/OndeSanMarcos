import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocationStore } from '../store/useLocationStore'
import { useToastStore } from '@/components/Toast/toastStore'
import { zoomToDistance } from '../scene/cameraMath'
import { type CameraApi, type CameraPose, TILT_2D, TILT_3D, useCameraStore } from '../scene/cameraStore'
import { useThemeStore } from '@/features/theme/useThemeStore'
import { toLocal } from '../utils/projection'

const animateTo = vi.fn()
const locate = vi.hoisted(() => vi.fn())

// jsdom no tiene WebGL: la escena se sustituye por un marcador.
vi.mock('../scene/CampusScene', () => ({ CampusScene: () => <div data-testid="map" /> }))
vi.mock('./PlaceLabels', () => ({ PlaceLabels: () => null }))

import { CampusMap } from './CampusMap'
import { seedPlaces } from '@/test/fixtures/places'

const pose: CameraPose = { target: [0, 0], distance: 600, polar: TILT_3D, azimuth: 0 }
const api: CameraApi = {
  pose: () => pose,
  size: () => ({ width: 1000, height: 800 }),
  animateTo,
  project: () => ({ x: 0, y: 0, visible: true, behind: false }),
}

/** Dibuja el mapa con la cámara lista y descarta el encuadre inicial. */
function renderMap() {
  render(<CampusMap />)
  act(() => useCameraStore.getState().register(api))
  animateTo.mockClear()
}

describe('CampusMap', () => {
  beforeEach(() => {
    seedPlaces()
    animateTo.mockClear()
    locate.mockReset()
    useToastStore.setState({ toasts: [] })
    useCameraStore.setState({ api: null, flat: false, extra: null })
    useLocationStore.setState({
      permission: 'unsupported',
      noticeOpen: false,
      position: null,
      locating: false,
      init: () => () => {},
      locate,
    })
  })

  it('RF-40.1: dibuja el mapa sin necesitar ningún token', () => {
    render(<CampusMap />)
    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('RF-40.3: muestra la atribución a OpenStreetMap', () => {
    render(<CampusMap />)
    expect(screen.getAllByText(/OpenStreetMap/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /OpenStreetMap/ })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright')
  })

  it('al estar lista la cámara, encuadra el campus entero sin animación', () => {
    render(<CampusMap />)
    act(() => useCameraStore.getState().register(api))
    expect(animateTo).toHaveBeenCalledTimes(1)
    expect(animateTo).toHaveBeenCalledWith(expect.objectContaining({ polar: TILT_3D }), 0)
  })

  it('RF-40.14: «Volver al campus» devuelve la cámara a la vista inicial', async () => {
    renderMap()
    await userEvent.click(screen.getByRole('button', { name: 'Volver al campus' }))
    expect(animateTo).toHaveBeenCalledWith(expect.objectContaining({ polar: TILT_3D }), expect.any(Number))
  })

  it('RF-13.1 y RF-13.27: «Planificar ruta» va justo debajo del botón de ubicación y abre el diálogo sin dibujar nada', async () => {
    renderMap()
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names.indexOf('Planificar ruta')).toBe(names.indexOf('Volver al campus') + 1)
    await userEvent.click(screen.getByRole('button', { name: 'Planificar ruta' }))
    expect(screen.getByRole('dialog', { name: 'Planificar ruta' })).toBeInTheDocument()
  })

  describe('vista 2D / 3D', () => {
    it('RF-13.43: el botón de vista va justo debajo de «Planificar ruta»', () => {
      renderMap()
      const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
      expect(names.indexOf('Vista 2D')).toBe(names.indexOf('Planificar ruta') + 1)
    })

    it('RF-40.7: aplana la cámara y luego vuelve a la inclinación del campus', async () => {
      renderMap()
      await userEvent.click(screen.getByRole('button', { name: 'Vista 2D' }))
      expect(animateTo).toHaveBeenLastCalledWith(expect.objectContaining({ polar: TILT_2D }), expect.any(Number))
      await userEvent.click(screen.getByRole('button', { name: 'Vista 3D' }))
      expect(animateTo).toHaveBeenLastCalledWith(expect.objectContaining({ polar: TILT_3D }), expect.any(Number))
      expect(screen.getByRole('button', { name: 'Vista 2D' })).toBeInTheDocument()
    })

    it('RF-40.7: la etiqueta sigue a la inclinación real de la cámara', () => {
      renderMap()
      act(() => useCameraStore.getState().syncFlat(true))
      expect(screen.getByRole('button', { name: 'Vista 3D' })).toBeInTheDocument()
      act(() => useCameraStore.getState().syncFlat(false))
      expect(screen.getByRole('button', { name: 'Vista 2D' })).toBeInTheDocument()
    })
  })

  it('RF-40.19: el tema oscuro es una opción más del menú y cambia el nombre al activarse', async () => {
    useThemeStore.setState({ theme: 'light' })
    renderMap()
    await userEvent.click(screen.getByRole('button', { name: 'Tema oscuro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Tema claro' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tema claro' }))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  describe('mi ubicación', () => {
    const pos = { coordinates: [-77.05, -12.03] as [number, number], accuracy: 30 }
    const button = (name: string) => screen.getByRole('button', { name })

    it('RF-15.12: con el permiso sin responder el botón es «Mi ubicación» y lo pide al pulsarlo', async () => {
      useLocationStore.setState({ permission: 'prompt' })
      locate.mockResolvedValue(pos)
      renderMap()
      await userEvent.click(button('Mi ubicación'))
      expect(locate).toHaveBeenCalled()
    })

    it('RF-15.8 y RF-15.12: con el permiso denegado el botón vuelve al campus y no lee la ubicación', async () => {
      useLocationStore.setState({ permission: 'denied' })
      renderMap()
      await userEvent.click(button('Volver al campus'))
      expect(locate).not.toHaveBeenCalled()
      expect(animateTo).toHaveBeenCalledWith(expect.objectContaining({ polar: TILT_3D }), expect.any(Number))
    })

    it('RF-15.7 y RF-40.14: con permiso el botón vuela a la ubicación, aunque esté fuera del campus, y amplía los límites', async () => {
      useLocationStore.setState({ permission: 'granted' })
      locate.mockResolvedValue(pos)
      renderMap()
      await userEvent.click(button('Mi ubicación'))
      const [target] = toLocal(pos.coordinates)
      const call = animateTo.mock.calls.at(-1)![0] as CameraPose
      expect(call.target[0]).toBeCloseTo(target)
      expect(call.distance).toBe(zoomToDistance(18))
      expect(useCameraStore.getState().extra).toEqual(pos.coordinates)
      expect(useCameraStore.getState().bounds().maxX).toBeGreaterThan(call.target[0])
    })

    it('RF-15.9: si no se puede leer, vuelve al campus y avisa', async () => {
      useLocationStore.setState({ permission: 'granted' })
      locate.mockResolvedValue(null)
      renderMap()
      await userEvent.click(button('Mi ubicación'))
      expect(animateTo).toHaveBeenCalledWith(expect.objectContaining({ polar: TILT_3D }), expect.any(Number))
      expect(useToastStore.getState().toasts[0]?.message).toMatch(/No pudimos obtener tu ubicación/)
    })

    it('RF-15.10: al entrar y al aceptar el permiso la cámara no se mueve', () => {
      useLocationStore.setState({ permission: 'granted' })
      renderMap()
      expect(animateTo).not.toHaveBeenCalled()
      expect(locate).not.toHaveBeenCalled()
    })

    it('RF-15.11: mientras localiza el botón está deshabilitado', () => {
      useLocationStore.setState({ permission: 'granted', locating: true })
      renderMap()
      expect(button('Mi ubicación')).toBeDisabled()
    })

    it('RF-15.16 y RF-40.6: los límites de la cámara incluyen una posición lejana guardada', () => {
      useLocationStore.setState({ permission: 'granted', position: pos })
      renderMap()
      expect(useCameraStore.getState().extra).toEqual(pos.coordinates)
    })

    it('RF-15.1: el aviso se muestra cuando está abierto', () => {
      useLocationStore.setState({ noticeOpen: true })
      renderMap()
      expect(screen.getByRole('dialog', { name: /dónde estás/i })).toBeInTheDocument()
    })
  })
})
