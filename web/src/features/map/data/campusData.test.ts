import { campusOsm, type Polygon } from './campusData'

const closed = (poly: Polygon) =>
  poly.every((ring) => ring.length >= 4 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1])

describe('campus-osm', () => {
  it('RF-40.3: tiene contorno, edificios y áreas verdes con la atribución', () => {
    expect(campusOsm.boundary.length).toBeGreaterThan(0)
    expect(campusOsm.buildings.length).toBeGreaterThan(0)
    expect(campusOsm.green.length).toBeGreaterThan(0)
    expect(campusOsm.license).toBe('ODbL')
  })

  it('RF-40.3: todos los polígonos están cerrados', () => {
    expect(campusOsm.boundary.every(closed)).toBe(true)
    expect(campusOsm.buildings.every((b) => closed(b.footprint))).toBe(true)
    expect(campusOsm.green.every((g) => closed(g.polygon))).toBe(true)
  })

  it('RF-40.20: trae tramos de las avenidas y calles que rodean al campus', () => {
    expect(campusOsm.roads.length).toBeGreaterThan(0)
    expect(campusOsm.roads.every((r) => r.line.length >= 2)).toBe(true)
    expect(campusOsm.roads.some((r) => r.kind === 'primary')).toBe(true)
  })

  it('RF-40.2: las alturas son positivas', () => {
    expect(campusOsm.buildings.every((b) => b.height > 0)).toBe(true)
  })
})
