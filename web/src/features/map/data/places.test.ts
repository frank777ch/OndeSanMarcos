import { PLACE_CATEGORIES, PLACES } from './places'

const count = (id: string) => PLACES.filter((p) => p.category === id).length
const byName = (text: string) => PLACES.filter((p) => p.name.includes(text))

describe('datos de lugares', () => {
  it('RF-11.1: hay 55 lugares con id único, nombre y coordenadas dentro del campus', () => {
    expect(PLACES).toHaveLength(55)
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(55)
    for (const p of PLACES) {
      expect(p.name.length).toBeGreaterThan(0)
      const [lng, lat] = p.coordinates
      expect(lng).toBeGreaterThan(-77.1)
      expect(lng).toBeLessThan(-77.07)
      expect(lat).toBeGreaterThan(-12.07)
      expect(lat).toBeLessThan(-12.045)
    }
  })

  it('RF-11.1: no hay nombres repetidos salvo el caso conocido de Ingeniería Industrial (ids 23 y 25)', () => {
    const seen = new Map<string, string[]>()
    for (const p of PLACES) seen.set(p.name, [...(seen.get(p.name) ?? []), p.id])
    const dupes = [...seen.values()].filter((ids) => ids.length > 1)
    expect(dupes).toEqual([['23', '25']])
  })

  it('RF-11.2: incluye los 15 lugares del asistente que no tenían punto', () => {
    const ids = [
      'rectorado',
      'oca',
      'posgrado',
      'cepreunmsm',
      'clinica-universitaria',
      'clinica-odontologia',
      'comedor-universitario',
      'biblioteca-central',
      'residencia-universitaria',
      'huaca-san-marcos',
      'estadio-universitario',
      'gimnasio-universitario',
      'derecho',
      'cafeteria-clinica-universitaria',
      'cafeteria-industrial',
    ]
    for (const id of ids) expect(PLACES.some((p) => p.id === id)).toBe(true)
  })

  it('RF-11.3: los lugares con equivalente no se duplican y reciben sus palabras clave', () => {
    const fisi = PLACES.filter((p) => p.keywords.some((k) => k.toLowerCase() === 'fisi'))
    expect(fisi.map((p) => p.id)).toEqual(['8'])
    expect(byName('Sistemas e Informática').filter((p) => p.category === 'facultades')).toHaveLength(1)
    // El punto conserva su ubicación original (la del mapa, no la del asistente).
    expect(PLACES.find((p) => p.id === '8')?.coordinates).toEqual([
      -77.0857217,
      -12.0535548,
    ])
    // El nombre se corrige con el del asistente.
    expect(byName('Ella Dunbar Temple')).toHaveLength(1)
    expect(byName('Dumber')).toHaveLength(0)
  })

  it('RF-11.4: hay 9 categorías con color y todo lugar pertenece a una', () => {
    expect(PLACE_CATEGORIES.map((c) => c.id)).toEqual([
      'facultades',
      'cafeterias',
      'auditorios',
      'campos-deportivos',
      'puertas',
      'administracion',
      'salud',
      'servicios',
      'otros',
    ])
    for (const c of PLACE_CATEGORIES) expect(c.color).toMatch(/^#[0-9a-f]{6}$/i)
    const ids = new Set(PLACE_CATEGORIES.map((c) => c.id))
    expect(PLACES.every((p) => ids.has(p.category))).toBe(true)
  })

  it('RF-11.4: conteo por categoría', () => {
    expect(count('facultades')).toBe(26)
    expect(count('cafeterias')).toBe(5)
    expect(count('auditorios')).toBe(2)
    expect(count('campos-deportivos')).toBe(4)
    expect(count('puertas')).toBe(8)
    expect(count('administracion')).toBe(4)
    expect(count('salud')).toBe(2)
    expect(count('servicios')).toBe(3)
    expect(count('otros')).toBe(1)
  })

  it('RF-11.5: los chips nuevos van después de los 5 actuales y en orden', () => {
    expect(PLACE_CATEGORIES.slice(5).map((c) => c.label)).toEqual([
      'Administración',
      'Salud',
      'Servicios',
      'Otros',
    ])
  })

  describe('datos de la ficha', () => {
    const have = (field: keyof (typeof PLACES)[number]) =>
      PLACES.filter((p) => p[field] !== undefined).length

    it('RF-12.1: conteo de lugares con cada dato', () => {
      expect(have('schedule')).toBe(38)
      expect(have('description')).toBe(36)
      expect(have('phone')).toBe(17)
      expect(have('annex')).toBe(4)
      expect(have('careers')).toBe(19)
      expect(have('services')).toBe(5)
      expect(have('usage')).toBe(2)
      expect(have('detailedSchedule')).toBe(2)
    })

    it('RF-12.1: la FISI trae horario, descripción, teléfono y carreras', () => {
      const fisi = PLACES.find((p) => p.id === '8')!
      expect(fisi.schedule).toBeTruthy()
      expect(fisi.description).toBeTruthy()
      expect(fisi.phone).toBeTruthy()
      expect(fisi.careers?.length).toBeGreaterThan(0)
    })

    it('RF-12.1: Ciencias Económicas (puntos 27 y 31) comparten los mismos datos', () => {
      const a = PLACES.find((p) => p.id === '27')!
      const b = PLACES.find((p) => p.id === '31')!
      expect(a.careers).toBeDefined()
      expect(a.careers).toEqual(b.careers)
      expect(a.description).toEqual(b.description)
    })

    it('RF-12.1: la Biblioteca Central tiene horario detallado', () => {
      const bib = PLACES.find((p) => p.id === 'biblioteca-central')!
      expect(bib.detailedSchedule?.length).toBeGreaterThan(0)
    })

    it('RF-12.2: puertas y canchas no tienen datos de ficha (ficha mínima)', () => {
      const minimal = PLACES.filter(
        (p) => p.category === 'puertas' || p.name.startsWith('Cancha'),
      )
      expect(minimal).toHaveLength(10)
      for (const p of minimal) {
        expect(p.schedule ?? p.description ?? p.phone ?? p.careers).toBeUndefined()
      }
    })

    it('RF-12.2: 17 lugares no tienen ningún dato de ficha', () => {
      const none = PLACES.filter(
        (p) =>
          !p.schedule &&
          !p.description &&
          !p.phone &&
          !p.annex &&
          !p.careers &&
          !p.services &&
          !p.usage &&
          !p.detailedSchedule,
      )
      expect(none).toHaveLength(17)
    })
  })
})
