import { PLACE_CATEGORIES, PLACES } from '../data/places'
import { filterPlaces, placeIdFromFeatures, placesToGeoJSON } from './places'

describe('filterPlaces', () => {
  it('RF-11.4: la lista completa tiene 55 lugares', () => {
    expect(PLACES).toHaveLength(55)
  })

  it('RF-10.3: sin categoría devuelve todos los lugares', () => {
    expect(filterPlaces(PLACES, null)).toHaveLength(PLACES.length)
  })

  it('RF-11.4: con categoría devuelve solo esa', () => {
    const result = filterPlaces(PLACES, 'cafeterias')
    expect(result).toHaveLength(5)
    expect(result.every((p) => p.category === 'cafeterias')).toBe(true)
  })
})

describe('placesToGeoJSON', () => {
  it('RF-10.3: genera un punto [lng, lat] por lugar con su nombre', () => {
    const geo = placesToGeoJSON(PLACES)
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features).toHaveLength(PLACES.length)
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

describe('placeIdFromFeatures', () => {
  it('RF-12.3: devuelve el id del primer punto tocado', () => {
    expect(
      placeIdFromFeatures([{ properties: { id: '3' } }, { properties: { id: '8' } }]),
    ).toBe('3')
  })

  it('RF-12.7: sin puntos tocados devuelve null', () => {
    expect(placeIdFromFeatures(undefined)).toBeNull()
    expect(placeIdFromFeatures([])).toBeNull()
    expect(placeIdFromFeatures([{ properties: null }])).toBeNull()
    expect(placeIdFromFeatures([{ properties: { id: 3 } }])).toBeNull()
  })
})
