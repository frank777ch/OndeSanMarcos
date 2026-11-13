import { CATEGORIES, PLACES, catId } from '@/test/fixtures/places'
import { filterPlaces, placeIdFromFeatures, placesToGeoJSON } from './places'

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

describe('placesToGeoJSON', () => {
  it('RF-10.3: genera un punto [lng, lat] por lugar con su nombre', () => {
    const geo = placesToGeoJSON(PLACES, CATEGORIES)
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features).toHaveLength(PLACES.length)
    expect(geo.features[0].geometry.coordinates).toEqual(PLACES[0].coordinates)
    expect(geo.features[0].properties.name).toBe(PLACES[0].name)
  })

  it('RF-28.7: un punto por lugar con el color de su categoría, y gris si no se conoce', () => {
    const geo = placesToGeoJSON(
      [{ id: 1, slug: 'a', name: 'A', category: catId('nueva'), coordinates: [-77, -12], keywords: [] }, PLACES[0]],
      CATEGORIES,
    )
    expect(geo.features.map((f) => f.properties.id)).toEqual([1, PLACES[0].id])
    expect(geo.features[0].properties.color).toBe('#757575')
    expect(geo.features[1].properties.color).toBe(CATEGORIES.find((c) => c.id === PLACES[0].category)?.color)
  })

  it('RF-10.4: cada punto lleva el color de su categoría', () => {
    const geo = placesToGeoJSON(PLACES, CATEGORIES)
    for (const f of geo.features) {
      const cat = CATEGORIES.find((c) => c.id === f.properties.category)
      expect(f.properties.color).toBe(cat?.color)
    }
  })
})

describe('placeIdFromFeatures', () => {
  it('RF-12.3: devuelve el id del primer punto tocado', () => {
    expect(
      placeIdFromFeatures([{ properties: { id: 3 } }, { properties: { id: 8 } }]),
    ).toBe(3)
  })

  it('RF-12.7: sin puntos tocados devuelve null', () => {
    expect(placeIdFromFeatures(undefined)).toBeNull()
    expect(placeIdFromFeatures([])).toBeNull()
    expect(placeIdFromFeatures([{ properties: null }])).toBeNull()
    expect(placeIdFromFeatures([{ properties: { id: 'puerta-3' } }])).toBeNull()
  })
})
