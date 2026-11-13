import { describe, expect, it } from 'vitest'
import { PLACES } from '@/test/fixtures/places'
import { buildMockResponse } from './mockChat'
import { seedPlaces } from '@/test/fixtures/places'

describe('buildMockResponse', () => {
  beforeEach(() => seedPlaces())
  it('RF-04.20: devuelve el lugar nombrado con id, nombre y horario', () => {
    const res = buildMockResponse('quiero ir a la biblioteca')
    const library = res.locations.find((l) => l.id === 'biblioteca-central')
    expect(library).toBeDefined()
    expect(library?.name).toBe('Biblioteca Central Pedro Zulen')
    expect(library?.schedule).toBe(PLACES.find((p) => p.id === 'biblioteca-central')?.schedule)
  })

  it('RF-04.20: no distingue mayúsculas ni tildes', () => {
    const ids = (q: string) => buildMockResponse(q).locations.map((l) => l.id)
    expect(ids('INGENIERÍA DE SISTEMAS')).toEqual(ids('ingenieria de sistemas'))
    expect(ids('ingenieria de sistemas')).toContain('fisi')
  })

  it('RF-04.20: devuelve todos los lugares nombrados', () => {
    const res = buildMockResponse('la fisi y la biblioteca')
    const ids = res.locations.map((l) => l.id)
    expect(ids).toContain('fisi')
    expect(ids).toContain('biblioteca-central')
    expect(res.answer).toContain(`${res.locations.length} lugares`)
  })

  it('RF-04.20: solo coincide con palabras completas', () => {
    expect(buildMockResponse('un aperitivo').locations.map((l) => l.id)).not.toContain('fisi')
  })

  it('RF-04.21: sin lugar responde que es una demostración y sin lugares', () => {
    const res = buildMockResponse('hola')
    expect(res.locations).toEqual([])
    expect(res.answer).toMatch(/demostraci[oó]n/i)
  })

  it('RF-04.22: todos los id que devuelve existen en el mapa', () => {
    const ids = new Set(PLACES.map((p) => p.id))
    for (const query of ['biblioteca', 'fisi', 'comedor', 'gimnasio', 'rectorado', 'facultad']) {
      for (const l of buildMockResponse(query).locations) expect(ids.has(l.id)).toBe(true)
    }
  })
})
