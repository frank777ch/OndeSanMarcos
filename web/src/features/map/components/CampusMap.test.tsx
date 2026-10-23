import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, useImperativeHandle } from 'react'
import { CAMPUS } from '../constants/campus'
import { useMapStore } from '../store/useMapStore'

const flyTo = vi.fn()
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
    useImperativeHandle(ref, () => ({ flyTo }))
    return <div data-testid="map" />
  }),
  NavigationControl: () => null,
  useMap: () => ({ current: undefined }),
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
