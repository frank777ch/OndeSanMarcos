import { MAX_QUERY_LENGTH, normalizeQuery } from './query'

describe('normalizeQuery', () => {
  it('RF-05.3: un texto vacío o de espacios queda vacío', () => {
    expect(normalizeQuery('')).toBe('')
    expect(normalizeQuery('   \n\t ')).toBe('')
  })

  it('RF-05.6: recorta los espacios de los extremos y conserva los internos', () => {
    expect(normalizeQuery('  hola\nmundo  ')).toBe('hola\nmundo')
  })

  it('RF-05.6: no pasa de 1000 caracteres', () => {
    expect(normalizeQuery('a'.repeat(1500))).toHaveLength(MAX_QUERY_LENGTH)
    expect(normalizeQuery('a'.repeat(1000))).toHaveLength(1000)
  })
})
