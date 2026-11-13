import { render } from '@testing-library/react'
import { act } from 'react'
import { PLACES, idOf } from '@/test/fixtures/places'
import { useMapStore } from '../store/useMapStore'

import { useCameraStore } from '../scene/cameraStore'
import { FlyToSelection } from './FlyToSelection'

const flyTo = vi.fn()
const realFlyTo = useCameraStore.getState().flyTo
import { seedPlaces } from '@/test/fixtures/places'

describe('FlyToSelection', () => {
  afterAll(() => useCameraStore.setState({ flyTo: realFlyTo }))

  beforeEach(() => {
    seedPlaces()
    flyTo.mockClear()
    useCameraStore.setState({ flyTo })
    useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
  })

  it('RF-11.13: sin selección no mueve la cámara', () => {
    render(<FlyToSelection />)
    expect(flyTo).not.toHaveBeenCalled()
  })

  it('RF-11.13 y RF-40.10: al elegir un lugar vuela a sus coordenadas', () => {
    render(<FlyToSelection />)
    act(() => useMapStore.getState().selectPlace(idOf('puerta-3')))
    const place = PLACES.find((p) => p.slug === 'puerta-3')!
    expect(flyTo).toHaveBeenCalledWith(place.coordinates, expect.objectContaining({ zoom: 18 }))
  })

  it('RF-11.13: al limpiar la selección no vuelve a volar', () => {
    render(<FlyToSelection />)
    act(() => useMapStore.getState().selectPlace(idOf('puerta-3')))
    flyTo.mockClear()
    act(() => useMapStore.getState().clearSelection())
    expect(flyTo).not.toHaveBeenCalled()
  })

  it('RF-12.3: un toque en el mapa no mueve la cámara', () => {
    render(<FlyToSelection />)
    act(() => useMapStore.getState().selectPlace(idOf('puerta-3'), 'map'))
    expect(flyTo).not.toHaveBeenCalled()
  })

  it('RF-12.4: elegir desde otra fuente sí vuela', () => {
    render(<FlyToSelection />)
    act(() => useMapStore.getState().selectPlace(idOf('puerta-3'), 'other'))
    expect(flyTo).toHaveBeenCalledTimes(1)
  })

  it('RF-05.20 y RF-05.21: al volver al mapa con el lugar ya elegido desde otra fuente, vuela de nuevo', () => {
    act(() => useMapStore.getState().selectPlace(idOf('puerta-3'), 'other'))
    const first = render(<FlyToSelection />)
    expect(flyTo).toHaveBeenCalledTimes(1)
    first.unmount()
    render(<FlyToSelection />)
    expect(flyTo).toHaveBeenCalledTimes(2)
  })
})
