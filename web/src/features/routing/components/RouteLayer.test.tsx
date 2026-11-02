import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useRouteStore } from '../store/useRouteStore'

vi.mock('react-map-gl/mapbox', () => ({
  Source: ({ id, data, children }: { id: string; data: unknown; children: ReactNode }) => (
    <div data-testid={`source-${id}`} data-geojson={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Layer: ({ id, type }: { id: string; type: string }) => <div data-testid={id} data-type={type} />,
}))

import { RouteLayer } from './RouteLayer'

const route = {
  origin: { kind: 'place' as const, placeId: '3' },
  destination: { kind: 'place' as const, placeId: '8' },
  path: [
    [-77.08, -12.05],
    [-77.081, -12.051],
  ] as [number, number][],
  distance: 150,
}

describe('RouteLayer', () => {
  beforeEach(() => useRouteStore.setState({ activeRoute: null }))

  it('RF-13.38: sin ruta iniciada no dibuja nada', () => {
    render(<RouteLayer />)
    expect(screen.queryByTestId('source-route')).not.toBeInTheDocument()
  })

  it('RF-13.38: con ruta iniciada dibuja solo una línea con los puntos de la ruta', () => {
    useRouteStore.setState({ activeRoute: route })
    render(<RouteLayer />)
    const geojson = JSON.parse(screen.getByTestId('source-route').dataset.geojson!)
    expect(geojson.geometry).toEqual({ type: 'LineString', coordinates: route.path })
    expect(screen.getByTestId('route-line').dataset.type).toBe('line')
    expect(screen.queryByTestId('route-marker')).not.toBeInTheDocument()
  })
})
