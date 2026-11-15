import { CAMPUS } from '../constants/campus'
import { fromLocal, toLocal } from './projection'

describe('projection', () => {
  it('el centro del campus es el origen', () => {
    const [x, z] = toLocal(CAMPUS.center)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })

  it('el este es +x y el norte es -z', () => {
    const [x] = toLocal([CAMPUS.center[0] + 0.001, CAMPUS.center[1]])
    const [, z] = toLocal([CAMPUS.center[0], CAMPUS.center[1] + 0.001])
    expect(x).toBeGreaterThan(0)
    expect(z).toBeLessThan(0)
  })

  it('0,001° de latitud son unos 111 m', () => {
    const [, z] = toLocal([CAMPUS.center[0], CAMPUS.center[1] - 0.001])
    expect(z).toBeCloseTo(111.32, 1)
  })

  it('fromLocal deshace toLocal', () => {
    const p: [number, number] = [-77.0801, -12.0549]
    const [lng, lat] = fromLocal(toLocal(p))
    expect(lng).toBeCloseTo(p[0], 9)
    expect(lat).toBeCloseTo(p[1], 9)
  })
})
