import { formatDistance, haversine, pathLength } from './distance'

describe('distance', () => {
  it('RF-13.21: haversine entre dos puntos conocidos', () => {
    // 0,001° de latitud ≈ 111,19 m
    expect(haversine([-77, -12], [-77, -11.999])).toBeCloseTo(111.19, 0)
    expect(haversine([-77, -12], [-77, -12])).toBe(0)
  })

  it('RF-13.21: pathLength suma los tramos', () => {
    const a: [number, number] = [-77, -12]
    const b: [number, number] = [-77, -11.999]
    const c: [number, number] = [-77, -11.998]
    expect(pathLength([a, b, c])).toBeCloseTo(haversine(a, b) + haversine(b, c), 6)
    expect(pathLength([a])).toBe(0)
  })

  it('RF-13.21: formatDistance en metros y en kilómetros', () => {
    expect(formatDistance(320.4)).toBe('320 m')
    expect(formatDistance(999.4)).toBe('999 m')
    expect(formatDistance(1000)).toBe('1,0 km')
    expect(formatDistance(1234)).toBe('1,2 km')
  })
})
