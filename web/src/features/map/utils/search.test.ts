import { PLACES, type Place } from '../data/places'
import { normalizeText, searchPlaces } from './search'

const names = (r: Place[]) => r.map((p) => p.name)

describe('normalizeText', () => {
  it('quita tildes, mayúsculas y espacios de los extremos', () => {
    expect(normalizeText('  Psicología ')).toBe('psicologia')
  })
})

describe('searchPlaces', () => {
  it('RF-11.7: encuentra por parte del nombre', () => {
    expect(names(searchPlaces(PLACES, 'psicolog'))).toContain('Facultad de Psicología')
  })

  it('RF-11.7: no distingue tildes ni mayúsculas', () => {
    const a = searchPlaces(PLACES, 'ECONOMICAS')
    const b = searchPlaces(PLACES, 'económicas')
    expect(a.length).toBeGreaterThan(0)
    expect(names(a)).toEqual(names(b))
    expect(a.every((p) => /econ[oó]micas/i.test(p.name))).toBe(true)
  })

  it('RF-11.7: encuentra por palabra clave', () => {
    const r = searchPlaces(PLACES, 'fisi')
    // «fisi» también está dentro de «Físicas», pero la sigla exacta va primero.
    expect(r[0].name).toContain('Sistemas e Informática')
    expect(r.length).toBeGreaterThan(1)
    expect(names(searchPlaces(PLACES, 'oca'))).toContain('Oficina Central de Admisión (OCA)')
  })

  it('RF-11.7: encuentra lugares que antes no estaban (biblioteca)', () => {
    const r = searchPlaces(PLACES, 'biblioteca')
    expect(r[0].id).toBe('biblioteca-central')
    expect(r[0].category).toBe('servicios')
  })

  it('RF-11.8: con menos de 2 caracteres no devuelve nada', () => {
    expect(searchPlaces(PLACES, '')).toEqual([])
    expect(searchPlaces(PLACES, 'f')).toEqual([])
    expect(searchPlaces(PLACES, '  f ')).toEqual([])
    expect(searchPlaces(PLACES, 'fa').length).toBeGreaterThan(0)
  })

  it('RF-11.9: sin coincidencias devuelve lista vacía', () => {
    expect(searchPlaces(PLACES, 'xyz')).toEqual([])
  })

  it('RF-11.10: palabra clave exacta, luego empieza con, luego contiene, al final palabra clave parcial', () => {
    const places: Place[] = [
      { id: 'd', name: 'Otro lugar', category: 'salud', coordinates: [0, 0], keywords: ['salud'] },
      { id: 'a', name: 'Centro de salud', category: 'salud', coordinates: [0, 0], keywords: [] },
      { id: 'b', name: 'Salud Total', category: 'salud', coordinates: [0, 0], keywords: [] },
      { id: 'c', name: 'Clínica', category: 'salud', coordinates: [0, 0], keywords: ['salud mental'] },
    ]
    expect(searchPlaces(places, 'salud').map((p) => p.id)).toEqual(['d', 'b', 'a', 'c'])
  })

  it('RF-11.10: devuelve como máximo 8 resultados', () => {
    expect(searchPlaces(PLACES, 'facultad')).toHaveLength(8)
    expect(searchPlaces(PLACES, 'facultad', 3)).toHaveLength(3)
  })

  it('RF-11.12: es una función síncrona y pura (no usa red)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const r = searchPlaces(PLACES, 'puerta 3')
    expect(Array.isArray(r)).toBe(true)
    expect(r.map((p) => p.name)).toContain('Puerta 3')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
