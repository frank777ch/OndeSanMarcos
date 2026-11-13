import { ADMIN_PLACES, adminPlace } from '@/test/fixtures/adminPlaces'
import { EMPTY_FILTERS, clampPage, filterPlaces, hasActiveFilters, paginate, pageCount } from './filters'
import { catId } from '@/test/fixtures/places'

const ids = (list: { slug: string }[]) => list.map((p) => p.slug)
const f = (over: Partial<typeof EMPTY_FILTERS>) => ({ ...EMPTY_FILTERS, ...over })

describe('filterPlaces · RF-31.4', () => {
  it('sin filtros devuelve todo', () => {
    expect(ids(filterPlaces(ADMIN_PLACES, EMPTY_FILTERS))).toEqual(['fisi', 'psicologia', 'puerta-3'])
  })

  it('la búsqueda ignora tildes y mayúsculas y mira nombre, sigla, palabras clave e id', () => {
    expect(ids(filterPlaces(ADMIN_PLACES, f({ q: 'PSICOLOGIA' })))).toEqual(['psicologia'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ q: 'fisi' })))).toEqual(['fisi'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ q: 'informatica' })))).toEqual(['fisi'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ q: 'puerta-3' })))).toEqual(['puerta-3'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ q: 'xyz' })))).toEqual([])
  })

  it('filtra por categoría, estado y verificación, y los combina', () => {
    expect(ids(filterPlaces(ADMIN_PLACES, f({ categoryId: catId('puertas') })))).toEqual(['puerta-3'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ published: 'no' })))).toEqual(['puerta-3'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ published: 'yes' })))).toEqual(['fisi', 'psicologia'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ verified: 'no' })))).toEqual(['psicologia', 'puerta-3'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ verified: 'yes' })))).toEqual(['fisi'])
    expect(ids(filterPlaces(ADMIN_PLACES, f({ verified: 'no', published: 'yes', q: 'psi' })))).toEqual(['psicologia'])
  })

  it('hasActiveFilters distingue «sin filtros»', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters(f({ q: '  ' }))).toBe(false)
    expect(hasActiveFilters(f({ verified: 'no' }))).toBe(true)
  })
})

describe('paginación · RF-31.6a', () => {
  const many = Array.from({ length: 54 }, (_, i) => adminPlace(`p${i}`))

  it('20 por página: 54 lugares son 3 páginas', () => {
    expect(pageCount(54)).toBe(3)
    expect(pageCount(0)).toBe(1)
    expect(paginate(many, 1)).toHaveLength(20)
    expect(paginate(many, 3)).toHaveLength(14)
    expect(ids(paginate(many, 2))[0]).toBe('p20')
  })

  it('clampPage deja la página dentro de lo que existe', () => {
    expect(clampPage(0, 54)).toBe(1)
    expect(clampPage(9, 54)).toBe(3)
    expect(clampPage(3, 41)).toBe(3)
    expect(clampPage(3, 40)).toBe(2)
    expect(clampPage(5, 0)).toBe(1)
  })

  it('una página fuera de rango muestra la última, no una vacía', () => {
    expect(paginate(many, 99)).toHaveLength(14)
  })
})
