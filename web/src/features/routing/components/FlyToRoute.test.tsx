import { render } from '@testing-library/react'
import { act } from 'react'
import { useRouteStore } from '../store/useRouteStore'

const fitBounds = vi.fn()
vi.mock('react-map-gl/mapbox', () => ({
  useMap: () => ({ current: { fitBounds, getContainer: () => document.body, getPitch: () => 42, getBearing: () => 17 } }),
}))

import { routeBounds } from '../utils/routeBounds'
import { idOf } from '@/test/fixtures/places'
import { FlyToRoute } from './FlyToRoute'

const route = {
  origin: { kind: 'place' as const, placeId: idOf('puerta-3') },
  destination: { kind: 'place' as const, placeId: idOf('fisi') },
  path: [
    [-77.083, -12.05],
    [-77.08, -12.055],
    [-77.081, -12.052],
  ] as [number, number][],
  distance: 400,
}

describe('FlyToRoute', () => {
  beforeEach(() => {
    fitBounds.mockClear()
    useRouteStore.setState({ activeRoute: null })
  })

  it('RF-13.42: routeBounds devuelve la caja que contiene toda la ruta', () => {
    expect(routeBounds(route.path)).toEqual([
      [-77.083, -12.055],
      [-77.08, -12.05],
    ])
  })

  it('RF-13.42: sin ruta no mueve la cámara', () => {
    render(<FlyToRoute />)
    expect(fitBounds).not.toHaveBeenCalled()
  })

  it('RF-13.42: al iniciar una ruta la cámara vuela para encuadrarla, con animación, espacio para los paneles y la misma inclinación y orientación', () => {
    render(<FlyToRoute />)
    act(() => useRouteStore.setState({ activeRoute: route }))
    expect(fitBounds).toHaveBeenCalledTimes(1)
    const [bounds, options] = fitBounds.mock.calls[0]
    expect(bounds).toEqual(routeBounds(route.path))
    expect(options.duration).toBeGreaterThan(0)
    expect(options.padding.top).toBeGreaterThan(0)
    expect(options.pitch).toBe(42)
    expect(options.bearing).toBe(17)
  })

  it('RF-13.42: quitar la ruta no mueve la cámara', () => {
    render(<FlyToRoute />)
    act(() => useRouteStore.setState({ activeRoute: route }))
    fitBounds.mockClear()
    act(() => useRouteStore.getState().clearActiveRoute())
    expect(fitBounds).not.toHaveBeenCalled()
  })

  it('RF-13.42: una ruta que ya existía al montar no mueve la cámara', () => {
    useRouteStore.setState({ activeRoute: route })
    render(<FlyToRoute />)
    expect(fitBounds).not.toHaveBeenCalled()
  })
})
