import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { forwardRef, useImperativeHandle } from 'react'
import { CAMPUS } from '../constants/campus'

const flyTo = vi.fn()

vi.mock('react-map-gl/mapbox', () => ({
  default: forwardRef(function FakeMap(_props: unknown, ref) {
    useImperativeHandle(ref, () => ({ flyTo }))
    return <div data-testid="map" />
  }),
  NavigationControl: () => null,
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
})
