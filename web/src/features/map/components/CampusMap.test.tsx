import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, useImperativeHandle } from 'react'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '../constants/campus'
import { useLocationStore } from '../store/useLocationStore'
import { useToastStore } from '@/components/Toast/toastStore'
import { useMapStore } from '../store/useMapStore'

const flyTo = vi.fn()
const setMaxBounds = vi.fn()
const locate = vi.hoisted(() => vi.fn())
const mapProps = vi.hoisted(() => {
  let current: Record<string, unknown> = {}
  return {
    get: () => current,
    set: (props: Record<string, unknown>) => {
      current = props
    },
  }
})

vi.mock('react-map-gl/mapbox', () => ({
  default: forwardRef(function FakeMap(props: Record<string, unknown>, ref) {
    mapProps.set(props)
    useImperativeHandle(ref, () => ({ flyTo, getMap: () => ({ setMaxBounds }) }))
    return <div data-testid="map" />
  }),
  useMap: () => ({ current: undefined }),
  AttributionControl: () => null,
  Source: () => null,
  Layer: () => null,
}))
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

const config = vi.hoisted(() => ({ mapbox: { token: '', hasToken: false } }))
vi.mock('@/config', () => ({ Config: config }))

import { CampusMap } from './CampusMap'

describe('CampusMap', () => {
  it('avisa si falta el token de Mapbox', () => {
    config.mapbox.hasToken = false
    render(<CampusMap />)
    expect(screen.getByRole('alert')).toHaveTextContent('VITE_MAPBOX_TOKEN')
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
  })

  it('muestra el mapa y vuelve al campus con el botón', async () => {
    config.mapbox.hasToken = true
    config.mapbox.token = 'pk.test'
    render(<CampusMap />)
    expect(screen.getByTestId('map')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Volver al campus' }))
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: CAMPUS.center, zoom: CAMPUS.camera.zoom }),
    )
  })

  describe('mi ubicación', () => {
    const pos = { coordinates: [-77.05, -12.03] as [number, number], accuracy: 30 }
    const button = (name: string) => screen.getByRole('button', { name })

    beforeEach(() => {
      config.mapbox.hasToken = true
      config.mapbox.token = 'pk.test'
      flyTo.mockClear()
      setMaxBounds.mockClear()
      locate.mockReset()
      useToastStore.setState({ toasts: [] })
      useLocationStore.setState({
        permission: 'unsupported',
        noticeOpen: false,
        position: null,
        locating: false,
        init: () => () => {},
        locate,
      })
    })

    it('RF-15.8 y RF-15.12: sin permiso el botón vuelve al campus y no lee la ubicación', async () => {
      useLocationStore.setState({ permission: 'prompt' })
      render(<CampusMap />)
      await userEvent.click(button('Volver al campus'))
      expect(locate).not.toHaveBeenCalled()
      expect(flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: CAMPUS.center }))
    })

    it('RF-15.7 y RF-15.12: con permiso el botón vuela a la ubicación, aunque esté fuera del campus', async () => {
      useLocationStore.setState({ permission: 'granted' })
      locate.mockResolvedValue(pos)
      render(<CampusMap />)
      await userEvent.click(button('Mi ubicación'))
      expect(flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: pos.coordinates }))
      const [sw, ne] = setMaxBounds.mock.calls[0][0]
      expect(sw[0]).toBeLessThanOrEqual(CAMPUS_MAX_BOUNDS[0][0])
      expect(ne[0]).toBeGreaterThan(pos.coordinates[0])
      expect(ne[1]).toBeGreaterThan(pos.coordinates[1])
    })

    it('RF-15.9: si no se puede leer, vuelve al campus y avisa', async () => {
      useLocationStore.setState({ permission: 'granted' })
      locate.mockResolvedValue(null)
      render(<CampusMap />)
      await userEvent.click(button('Mi ubicación'))
      expect(flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: CAMPUS.center }))
      expect(useToastStore.getState().toasts[0]?.message).toMatch(/No pudimos obtener tu ubicación/)
    })

    it('RF-15.10: al entrar y al aceptar el permiso la cámara no se mueve', () => {
      useLocationStore.setState({ permission: 'granted' })
      render(<CampusMap />)
      expect(flyTo).not.toHaveBeenCalled()
      expect(locate).not.toHaveBeenCalled()
    })

    it('RF-15.11: mientras localiza el botón está deshabilitado', () => {
      useLocationStore.setState({ permission: 'granted', locating: true })
      render(<CampusMap />)
      expect(button('Mi ubicación')).toBeDisabled()
    })

    it('RF-15.16: los límites del mapa incluyen una posición lejana guardada', () => {
      useLocationStore.setState({ permission: 'granted', position: pos })
      render(<CampusMap />)
      const [, ne] = mapProps.get().maxBounds as [number[], number[]]
      expect(ne[0]).toBeGreaterThan(pos.coordinates[0])
    })

    it('RF-15.1: el aviso se muestra cuando está abierto', () => {
      useLocationStore.setState({ noticeOpen: true })
      render(<CampusMap />)
      expect(screen.getByRole('dialog', { name: /dónde estás/i })).toBeInTheDocument()
    })
  })

  describe('toque en el mapa', () => {
    type ClickEvent = { features?: { properties?: Record<string, unknown> | null }[] }
    const click = (e: ClickEvent) => (mapProps.get().onClick as (e: ClickEvent) => void)(e)

    beforeEach(() => {
      config.mapbox.hasToken = true
      config.mapbox.token = 'pk.test'
      useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
      render(<CampusMap />)
    })

    it('RF-12.3: solo los puntos de lugares son interactivos', () => {
      expect(mapProps.get().interactiveLayerIds).toEqual(['places-circles'])
    })

    it('RF-12.3: tocar un punto elige el lugar con origen «map»', () => {
      click({ features: [{ properties: { id: '3' } }] })
      expect(useMapStore.getState().selectedPlaceId).toBe('3')
      expect(useMapStore.getState().selectionOrigin).toBe('map')
    })

    it('RF-12.7: tocar una zona sin puntos no cambia ni cierra la ficha', () => {
      useMapStore.getState().selectPlace('8', 'map')
      click({ features: [] })
      click({})
      expect(useMapStore.getState().selectedPlaceId).toBe('8')
    })
  })
})
