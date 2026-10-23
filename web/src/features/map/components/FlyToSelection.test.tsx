import { render } from '@testing-library/react'
import { act } from 'react'
import { PLACES } from '../data/places'
import { useMapStore } from '../store/useMapStore'

const flyTo = vi.fn()
vi.mock('react-map-gl/mapbox', () => ({ useMap: () => ({ current: { flyTo } }) }))

import { FlyToSelection } from './FlyToSelection'

describe('FlyToSelection', () => {
  beforeEach(() => {
    flyTo.mockClear()
    useMapStore.setState({ activeCategory: null, selectedPlaceId: null })
  })

  it('RF-11.13: sin selección no mueve la cámara', () => {
    render(<FlyToSelection />)
    expect(flyTo).not.toHaveBeenCalled()
  })

  it('RF-11.13: al elegir un lugar vuela a sus coordenadas', () => {
    render(<FlyToSelection />)
    act(() => useMapStore.getState().selectPlace('3'))
    const place = PLACES.find((p) => p.id === '3')!
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: place.coordinates, zoom: 18 }),
    )
  })

  it('RF-11.13: al limpiar la selección no vuelve a volar', () => {
    render(<FlyToSelection />)
    act(() => useMapStore.getState().selectPlace('3'))
    flyTo.mockClear()
    act(() => useMapStore.getState().clearSelection())
    expect(flyTo).not.toHaveBeenCalled()
  })
})
