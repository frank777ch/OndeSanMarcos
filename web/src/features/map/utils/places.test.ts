import { PLACE_CATEGORIES, PLACES } from '../data/places'
import { filterPlaces, placesToGeoJSON } from './places'

describe('filterPlaces', () => {
  it('RF-10.3: sin categoría devuelve todos los lugares', () => {
    expect(filterPlaces(PLACES, null)).toHaveLength(40)
  })

  it('RF-10.6: con categoría devuelve solo esa', () => {
    const result = filterPlaces(PLACES, 'cafeterias')
    expect(result).toHaveLength(3)
    expect(result.every((p) => p.category === 'cafeterias')).toBe(true)
  })
})

describe('placesToGeoJSON', () => {
  it('RF-10.3: genera un punto [lng, lat] por lugar con su nombre', () => {
    const geo = placesToGeoJSON(PLACES)
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features).toHaveLength(40)
    expect(geo.features[0].geometry.coordinates).toEqual(PLACES[0].coordinates)
    expect(geo.features[0].properties.name).toBe(PLACES[0].name)
  })

  it('RF-10.4: cada punto lleva el color de su categoría', () => {
    const geo = placesToGeoJSON(PLACES)
    for (const f of geo.features) {
      const cat = PLACE_CATEGORIES.find((c) => c.id === f.properties.category)
      expect(f.properties.color).toBe(cat?.color)
    }
  })
})
