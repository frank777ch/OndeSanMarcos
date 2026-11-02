import { shouldCloseSheet } from './sheet'

describe('shouldCloseSheet', () => {
  it('RF-13.48: cierra si se subió más de 80 px', () => {
    expect(shouldCloseSheet(-100)).toBe(true)
    expect(shouldCloseSheet(-81)).toBe(true)
  })

  it('RF-13.48: no cierra con 80 px o menos, ni hacia abajo', () => {
    expect(shouldCloseSheet(-80)).toBe(false)
    expect(shouldCloseSheet(-40)).toBe(false)
    expect(shouldCloseSheet(0)).toBe(false)
    expect(shouldCloseSheet(120)).toBe(false)
  })
})
