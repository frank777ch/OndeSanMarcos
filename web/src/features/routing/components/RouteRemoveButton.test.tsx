import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useRouteStore } from '../store/useRouteStore'

vi.mock('react-map-gl/mapbox', () => ({
  Marker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>,
  useMap: () => ({ current: undefined }),
}))

import { idOf } from '@/test/fixtures/places'
import { RouteRemoveButton } from './RouteRemoveButton'

const route = {
  origin: { kind: 'place' as const, placeId: idOf('puerta-3') },
  destination: { kind: 'place' as const, placeId: idOf('fisi') },
  path: [
    [-77.08, -12.05],
    [-77.081, -12.051],
  ] as [number, number][],
  distance: 150,
}

describe('RouteRemoveButton', () => {
  beforeEach(() => useRouteStore.setState({ activeRoute: null, routeHover: null }))

  it('no se muestra sin hover', () => {
    useRouteStore.setState({ activeRoute: route })
    render(<RouteRemoveButton />)
    expect(screen.queryByRole('button', { name: 'Quitar ruta' })).not.toBeInTheDocument()
  })

  it('con ruta y hover, «Quitar ruta» elimina la ruta', async () => {
    useRouteStore.setState({ activeRoute: route, routeHover: [-77.08, -12.05] })
    render(<RouteRemoveButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Quitar ruta' }))
    expect(useRouteStore.getState().activeRoute).toBeNull()
    expect(useRouteStore.getState().routeHover).toBeNull()
  })
})
