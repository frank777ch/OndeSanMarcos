import { renderHook } from '@testing-library/react'
import { CATEGORIES, PLACES, catId, seedPlaces } from '@/test/fixtures/places'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'
import { useVisiblePlaces } from './useVisiblePlaces'

describe('useVisiblePlaces', () => {
  beforeEach(() => {
    seedPlaces()
    useMapStore.setState({ activeCategory: null })
  })

  it('RF-28.3: sin datos listos no hay lugares', () => {
    usePlacesStore.setState({ status: 'loading' })
    expect(renderHook(() => useVisiblePlaces()).result.current).toEqual([])
  })

  it('RF-40.9: un punto por lugar con el color de su categoría', () => {
    const { result } = renderHook(() => useVisiblePlaces())
    expect(result.current).toHaveLength(PLACES.length)
    for (const p of result.current) {
      const place = PLACES.find((x) => x.id === p.id)!
      expect(p.color).toBe(CATEGORIES.find((c) => c.id === place.category)?.color)
      expect(p.position[1]).toBe(1)
    }
  })

  it('RF-40.9: filtra por la categoría activa', () => {
    useMapStore.setState({ activeCategory: catId('cafeterias') })
    const { result } = renderHook(() => useVisiblePlaces())
    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.every((p) => PLACES.find((x) => x.id === p.id)!.category === catId('cafeterias'))).toBe(true)
  })

  it('RF-28.7: una categoría desconocida se dibuja en gris', () => {
    usePlacesStore.setState({
      places: [{ id: 1, slug: 'a', name: 'A', category: catId('nueva'), coordinates: [-77.08, -12.05], keywords: [] }],
    })
    const { result } = renderHook(() => useVisiblePlaces())
    expect(result.current[0].color).toBe('#757575')
  })
})
