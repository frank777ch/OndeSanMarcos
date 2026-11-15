import { render } from '@testing-library/react'
import { act } from 'react'
import { useRouteStore } from '../store/useRouteStore'

import { useCameraStore } from '@/features/map/scene/cameraStore'
import { routeBounds } from '../utils/routeBounds'
import { idOf } from '@/test/fixtures/places'
import { FlyToRoute } from './FlyToRoute'

const fitPoints = vi.fn()
const realFitPoints = useCameraStore.getState().fitPoints
const container = { current: document.body }

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
  afterAll(() => useCameraStore.setState({ fitPoints: realFitPoints }))

  beforeEach(() => {
    fitPoints.mockClear()
    useCameraStore.setState({ fitPoints })
    useRouteStore.setState({ activeRoute: null })
  })

  it('RF-13.42: routeBounds devuelve la caja que contiene toda la ruta', () => {
    expect(routeBounds(route.path)).toEqual([
      [-77.083, -12.055],
      [-77.08, -12.05],
    ])
  })

  it('RF-13.42: sin ruta no mueve la cámara', () => {
    render(<FlyToRoute container={container} />)
    expect(fitPoints).not.toHaveBeenCalled()
  })

  it('RF-13.42: al iniciar una ruta la cámara se encuadra con animación y con espacio para los paneles (la inclinación y la orientación las conserva el store)', () => {
    render(<FlyToRoute container={container} />)
    act(() => useRouteStore.setState({ activeRoute: route }))
    expect(fitPoints).toHaveBeenCalledTimes(1)
    const [points, padding, options] = fitPoints.mock.calls[0]
    expect(points).toEqual(route.path)
    expect(options.duration).toBeGreaterThan(0)
    expect(padding.top).toBeGreaterThan(0)
    expect(padding.left).toBeGreaterThan(0)
  })

  it('RF-13.42: quitar la ruta no mueve la cámara', () => {
    render(<FlyToRoute container={container} />)
    act(() => useRouteStore.setState({ activeRoute: route }))
    fitPoints.mockClear()
    act(() => useRouteStore.getState().clearActiveRoute())
    expect(fitPoints).not.toHaveBeenCalled()
  })

  it('RF-13.42: una ruta que ya existía al montar no mueve la cámara', () => {
    useRouteStore.setState({ activeRoute: route })
    render(<FlyToRoute container={container} />)
    expect(fitPoints).not.toHaveBeenCalled()
  })
})
