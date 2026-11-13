import { validatePasswordForm } from './passwordRules'

const ok = { current: 'clave-actual', next: 'nueva-clave-1', confirm: 'nueva-clave-1' }

describe('validatePasswordForm · RF-37.12', () => {
  it('sin errores con datos válidos (también con tildes)', () => {
    expect(validatePasswordForm(ok)).toEqual({})
    expect(validatePasswordForm({ ...ok, next: 'contraseña2026', confirm: 'contraseña2026' })).toEqual({})
  })
  it('los tres campos son obligatorios', () => {
    expect(Object.keys(validatePasswordForm({ current: '', next: '', confirm: '' })).sort()).toEqual(['confirm', 'current', 'next'])
  })
  it.each([
    ['corta1', 'al menos 8'],
    ['sololetrasaqui', 'letra y un número'],
    ['123456789012', 'letra y un número'],
    ['a1'.repeat(40), 'demasiado larga'],
    ['clave-actual1', 'distinta de la actual'],
  ])('rechaza «%s»', (next, text) => {
    expect(validatePasswordForm({ ...ok, current: 'clave-actual1', next, confirm: next }).next).toContain(text)
  })
  it('la confirmación debe coincidir', () => {
    expect(validatePasswordForm({ ...ok, confirm: 'otra-clave-2' }).confirm).toContain('No coincide')
  })
})
