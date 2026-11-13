import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CATEGORIES, PLACES, resetPlaces, seedPlaces } from '@/test/fixtures/places'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'

const sourceProps = vi.hoisted(() => ({ last: null as null | { data: { features: { properties: Record<string, string> }[] } } }))
vi.mock('react-map-gl/mapbox', () => ({
  Source: (props: { data: { features: { properties: Record<string, string> }[] }; children: ReactNode }) => {
    sourceProps.last = props
    return <div data-testid="source" />
  },
  Layer: () => null,
}))

import { PlacesLayer } from './PlacesLayer'

describe('PlacesLayer', () => {
  beforeEach(() => {
    sourceProps.last = null
    useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
  })

  it('RF-28.3: sin lugares cargados (cargando o con error) no dibuja nada', () => {
    resetPlaces()
    const { container, rerender } = render(<PlacesLayer />)
    expect(container).toBeEmptyDOMElement()
    usePlacesStore.setState({ status: 'error' })
    rerender(<PlacesLayer />)
    expect(container).toBeEmptyDOMElement()
  })

  it('RF-28.7: dibuja un punto por lugar con el color de su categoría', () => {
    seedPlaces()
    render(<PlacesLayer />)
    const features = sourceProps.last!.data.features
    expect(features).toHaveLength(PLACES.length)
    const fisi = features.find((f) => f.properties.id === 'fisi')!
    expect(fisi.properties.color).toBe(CATEGORIES.find((c) => c.id === 'facultades')!.color)
  })

  it('RF-28.7: un lugar que no está en la API no aparece, y el filtro de categoría sigue funcionando', () => {
    seedPlaces()
    useMapStore.setState({ activeCategory: 'puertas' })
    render(<PlacesLayer />)
    const ids = sourceProps.last!.data.features.map((f) => f.properties.id)
    expect(ids.sort()).toEqual(['puerta-1', 'puerta-2', 'puerta-3'])
  })
})
