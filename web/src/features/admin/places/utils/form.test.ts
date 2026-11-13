import { adminPlace } from '@/test/fixtures/adminPlaces'
import { coordinateErrors } from './form'
import { canSubmit, descendantIds, emptyForm, formToInput, isDirty, listFromText, placeToForm } from './form'
import { PLACE_AREA, inPlaceArea } from './bounds'
import { catId } from '@/test/fixtures/places'

const valid = () => ({ ...emptyForm(), name: 'Lab', categoryId: catId('facultades'), lat: '-12.0535', lng: '-77.0857' })

describe('listFromText · RF-31.14a', () => {
  it('un elemento por línea, sin vacíos ni repetidos (sin distinguir mayúsculas)', () => {
    expect(listFromText(' Redes \n\n redes\r\nWifi \n  ')).toEqual(['Redes', 'Wifi'])
    expect(listFromText('')).toEqual([])
  })
})

describe('placeToForm / formToInput', () => {
  it('ida y vuelta de un lugar completo', () => {
    const place = adminPlace('fisi', {
      shortName: 'FISI', keywords: ['a', 'b'], phone: '1', careers: ['X'], parentPlaceId: 9,
      verifiedAt: '2026-01-01T00:00:00Z', isPublished: false,
    })
    const form = placeToForm(place)
    expect(form).toMatchObject({ keywords: 'a\nb', lat: '-12.0535', verified: true, isPublished: false })
    expect(formToInput(form)).toMatchObject({
      shortName: 'FISI', keywords: ['a', 'b'], phone: '1', careers: ['X'], parentPlaceId: 9,
      lat: -12.0535, verified: true, isPublished: false,
    })
  })

  it('los textos vacíos o de espacios se envían como null', () => {
    const input = formToInput({ ...valid(), name: '  Lab ', phone: '   ', description: '' })
    expect(input.name).toBe('Lab')
    expect(input.phone).toBeNull()
    expect(input.description).toBeNull()
    expect(input.keywords).toEqual([])
  })
})

describe('canSubmit · RF-31.15', () => {
  it('exige nombre, categoría y coordenadas dentro del área', () => {
    expect(canSubmit(valid())).toBe(true)
    expect(canSubmit({ ...valid(), name: '  ' })).toBe(false)
    expect(canSubmit({ ...valid(), categoryId: null })).toBe(false)
    expect(canSubmit({ ...valid(), lat: '' })).toBe(false)
    expect(canSubmit({ ...valid(), lat: 'abc' })).toBe(false)
    expect(canSubmit({ ...valid(), lat: '40' })).toBe(false)
  })
})

describe('coordinateErrors · RF-31.23', () => {
  it('sin errores si están vacías o bien', () => {
    expect(coordinateErrors({ lat: '', lng: '' })).toEqual({})
    expect(coordinateErrors({ lat: '-12.05', lng: '-77.08' })).toEqual({})
  })
  it('avisa de un valor no numérico y de un punto fuera del área', () => {
    expect(coordinateErrors({ lat: 'abc', lng: '-77.08' }).lat).toBe('Debe ser un número.')
    expect(coordinateErrors({ lat: '-12.05', lng: 'x' }).lng).toBe('Debe ser un número.')
    expect(coordinateErrors({ lat: '40', lng: '-77.08' }).lat).toMatch(/fuera del área/)
  })
})

describe('isDirty · RF-31.19', () => {
  it('un formulario igual al inicial no tiene cambios, aunque cambien los espacios', () => {
    const initial = placeToForm(adminPlace('a', { name: 'Lab' }))
    expect(isDirty(initial, { ...initial })).toBe(false)
    expect(isDirty(initial, { ...initial, name: ' Lab ' })).toBe(false)
  })
  it('detecta cambios de texto, selección y casillas', () => {
    const initial = placeToForm(adminPlace('a'))
    expect(isDirty(initial, { ...initial, name: 'Otro' })).toBe(true)
    expect(isDirty(initial, { ...initial, categoryId: catId('puertas') })).toBe(true)
    expect(isDirty(initial, { ...initial, isPublished: false })).toBe(true)
  })
})

describe('descendantIds · RF-31.14', () => {
  it('incluye el propio lugar y todos sus descendientes', () => {
    const places = [
      { id: 1, parentPlaceId: null },
      { id: 2, parentPlaceId: 1 },
      { id: 3, parentPlaceId: 2 },
      { id: 4, parentPlaceId: null },
    ]
    expect([...descendantIds(places, 1)].sort()).toEqual([1, 2, 3])
    expect([...descendantIds(places, 3)]).toEqual([3])
  })
})

describe('inPlaceArea · RF-31.24', () => {
  it('acepta el campus y rechaza lo de fuera', () => {
    expect(inPlaceArea(-12.0565, -77.0827)).toBe(true)
    expect(inPlaceArea(PLACE_AREA.minLat, PLACE_AREA.minLng)).toBe(true)
    expect(inPlaceArea(-12.0, -77.0827)).toBe(false)
    expect(inPlaceArea(-12.0565, -76.0)).toBe(false)
    expect(inPlaceArea(NaN, -77)).toBe(false)
  })
  it('coincide con el área del backend (lat -12.070…-12.043, lng -77.096…-77.069)', () => {
    expect(PLACE_AREA.minLat).toBeCloseTo(-12.07, 6)
    expect(PLACE_AREA.maxLat).toBeCloseTo(-12.043, 6)
    expect(PLACE_AREA.minLng).toBeCloseTo(-77.096, 6)
    expect(PLACE_AREA.maxLng).toBeCloseTo(-77.069, 6)
  })
})
