import { CAMPUS_MAX_BOUNDS } from '../constants/campus'
import {
  expandBounds,
  haloRadiusStops,
  metersPerPixel,
  MIN_HALO_PX,
  userLocationToGeoJSON,
} from './userLocation'

describe('userLocation', () => {
  it('RF-15.15: el halo crece con la precisión', () => {
    const small = haloRadiusStops(10, -12.05)
    const big = haloRadiusStops(500, -12.05)
    const last = small.length - 1
    expect(big[last][1]).toBeGreaterThan(small[last][1])
  })

  it('RF-15.15: el radio equivale a los metros de precisión (cuando supera el mínimo)', () => {
    const [zoom, px] = haloRadiusStops(200, -12.05).at(-1)!
    expect(px * metersPerPixel(zoom, -12.05)).toBeCloseTo(200, 3)
  })

  it('RF-15.15: nunca baja del tamaño mínimo visible', () => {
    for (const [, px] of haloRadiusStops(1, -12.05)) {
      expect(px).toBeGreaterThanOrEqual(MIN_HALO_PX)
    }
  })

  it('RF-15.15: los zooms van en orden ascendente (requisito de Mapbox)', () => {
    const zooms = haloRadiusStops(30, -12.05).map(([z]) => z)
    expect(zooms).toEqual([...zooms].sort((a, b) => a - b))
  })

  it('RF-15.16: expandBounds incluye un punto lejano', () => {
    const [sw, ne] = expandBounds(CAMPUS_MAX_BOUNDS, [-76.9, -11.9])
    expect(ne[0]).toBeGreaterThan(-76.9)
    expect(ne[1]).toBeGreaterThan(-11.9)
    expect(sw).toEqual(CAMPUS_MAX_BOUNDS[0])
  })

  it('RF-15.16: expandBounds no encoge los límites con un punto dentro', () => {
    expect(expandBounds(CAMPUS_MAX_BOUNDS, [-77.0827, -12.0565])).toEqual(CAMPUS_MAX_BOUNDS)
  })

  it('RF-15.14: el GeoJSON tiene un solo punto con la precisión', () => {
    const fc = userLocationToGeoJSON({ coordinates: [-77.08, -12.05], accuracy: 25 })
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0].geometry.coordinates).toEqual([-77.08, -12.05])
    expect(fc.features[0].properties.accuracy).toBe(25)
  })
})
