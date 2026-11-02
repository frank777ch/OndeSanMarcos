import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useLocationStore } from '../store/useLocationStore'

vi.mock('react-map-gl/mapbox', () => ({
  Source: ({ id, data, children }: { id: string; data: unknown; children: ReactNode }) => (
    <div data-testid={`source-${id}`} data-geojson={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Layer: ({ id, paint }: { id: string; paint: Record<string, unknown> }) => (
    <div data-testid={id} data-paint={JSON.stringify(paint)} />
  ),
}))

import { UserLocationLayer } from './UserLocationLayer'

describe('UserLocationLayer', () => {
  beforeEach(() => useLocationStore.setState({ position: null }))

  it('RF-15.19: sin posición no dibuja nada', () => {
    render(<UserLocationLayer />)
    expect(screen.queryByTestId('source-user-location')).not.toBeInTheDocument()
  })

  it('RF-15.14: con posición dibuja el punto azul con borde blanco y el halo translúcido', () => {
    useLocationStore.setState({ position: { coordinates: [-77.08, -12.05], accuracy: 40 } })
    render(<UserLocationLayer />)
    const dot = JSON.parse(screen.getByTestId('user-location-dot').dataset.paint!)
    const halo = JSON.parse(screen.getByTestId('user-location-halo').dataset.paint!)
    expect(dot['circle-stroke-color']).toBe('#ffffff')
    expect(dot['circle-color']).toBe(halo['circle-color'])
    expect(halo['circle-opacity']).toBeLessThan(0.5)
  })

  it('RF-15.15: el radio del halo es una interpolación por zoom', () => {
    useLocationStore.setState({ position: { coordinates: [-77.08, -12.05], accuracy: 40 } })
    render(<UserLocationLayer />)
    const halo = JSON.parse(screen.getByTestId('user-location-halo').dataset.paint!)
    expect(halo['circle-radius'].slice(0, 3)).toEqual(['interpolate', ['exponential', 2], ['zoom']])
  })
})
