import { PLACE_CATEGORIES, PLACES } from './places'

describe('datos de lugares', () => {
  it('RF-10.1: hay 40 lugares con id único, nombre y coordenadas dentro del campus', () => {
    expect(PLACES).toHaveLength(40)
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(40)
    for (const p of PLACES) {
      expect(p.name.length).toBeGreaterThan(0)
      const [lng, lat] = p.coordinates
      expect(lng).toBeGreaterThan(-77.1)
      expect(lng).toBeLessThan(-77.07)
      expect(lat).toBeGreaterThan(-12.07)
      expect(lat).toBeLessThan(-12.045)
    }
  })

  it('RF-10.2: hay 5 categorías con color y todo lugar pertenece a una', () => {
    expect(PLACE_CATEGORIES.map((c) => c.id)).toEqual([
      'facultades',
      'cafeterias',
      'auditorios',
      'campos-deportivos',
      'puertas',
    ])
    for (const c of PLACE_CATEGORIES) expect(c.color).toMatch(/^#[0-9a-f]{6}$/i)
    const ids = new Set(PLACE_CATEGORIES.map((c) => c.id))
    expect(PLACES.every((p) => ids.has(p.category))).toBe(true)
  })

  it('RF-10.2: conteo por categoría (25 / 3 / 2 / 2 / 8)', () => {
    const count = (id: string) => PLACES.filter((p) => p.category === id).length
    expect(count('facultades')).toBe(25)
    expect(count('cafeterias')).toBe(3)
    expect(count('auditorios')).toBe(2)
    expect(count('campos-deportivos')).toBe(2)
    expect(count('puertas')).toBe(8)
  })
})
