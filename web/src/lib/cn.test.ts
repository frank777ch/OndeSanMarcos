import { cn } from './cn'

describe('cn', () => {
  it('une clases y descarta valores falsos', () => {
    expect(cn('a', false, 'b', null, undefined, '', 'c')).toBe('a b c')
  })
})
