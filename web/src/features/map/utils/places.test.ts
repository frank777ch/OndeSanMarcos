import { PLACES, catId } from '@/test/fixtures/places'
import { filterPlaces } from './places'

describe('filterPlaces', () => {
  it('RF-10.3: sin categoría devuelve todos los lugares', () => {
    expect(filterPlaces(PLACES, null)).toHaveLength(PLACES.length)
  })

  it('RF-11.4: con categoría devuelve solo esa', () => {
    const result = filterPlaces(PLACES, catId('cafeterias'))
    expect(result).toHaveLength(1)
    expect(result.every((p) => p.category === catId('cafeterias'))).toBe(true)
  })
})
