import { campusOsm } from '../data/campusData'
import { fromLocal } from '../utils/projection'
import {
  BASE_DISTANCE,
  BOUNDS_MARGIN,
  cameraBounds,
  cameraPosition,
  clampToBox,
  fitCamera,
  MAX_DISTANCE,
  MIN_DISTANCE,
  zoomToDistance,
} from './cameraMath'

describe('cameraMath', () => {
  it('zoomToDistance: el zoom 16 es la distancia base y cada zoom la reduce a la mitad', () => {
    expect(zoomToDistance(16)).toBe(BASE_DISTANCE)
    expect(zoomToDistance(17)).toBe(BASE_DISTANCE / 2)
    expect(zoomToDistance(40)).toBe(MIN_DISTANCE)
    expect(zoomToDistance(0)).toBe(MAX_DISTANCE)
  })

  it('RF-40.6: los límites contienen el campus con un margen y se amplían con un punto lejano', () => {
    const base = cameraBounds()
    const far = fromLocal([base.maxX + 2000, 0])
    const extended = cameraBounds(far)
    expect(extended.maxX).toBeGreaterThan(base.maxX + 1900)
    expect(extended.minX).toBe(base.minX)
    expect(base.maxX - base.minX).toBeGreaterThan(2 * BOUNDS_MARGIN)
  })

  it('RF-40.6: clampToBox deja dentro el objetivo', () => {
    const box = cameraBounds()
    const [x, z] = clampToBox([box.maxX + 500, box.minZ - 500], box)
    expect([x, z]).toEqual([box.maxX, box.minZ])
  })

  it('cameraPosition: con inclinación 0 la cámara queda justo encima', () => {
    const [x, y, z] = cameraPosition([10, 20], 100, 0, 0)
    expect(x).toBeCloseTo(10)
    expect(y).toBeCloseTo(100)
    expect(z).toBeCloseTo(20)
  })

  describe('fitCamera (RF-40.11)', () => {
    const campus = campusOsm.boundary[0][0]
    const base = { width: 1000, height: 800, polar: 0, azimuth: 0 }
    const none = { top: 0, bottom: 0, left: 0, right: 0 }

    it('centra el contenido cuando no hay relleno', () => {
      const a = fromLocal([-100, -100])
      const b = fromLocal([100, 100])
      const { target } = fitCamera({ ...base, points: [a, b], padding: none })
      expect(target[0]).toBeCloseTo(0, 3)
      expect(target[1]).toBeCloseTo(0, 3)
    })

    it('con relleno a la izquierda (barra lateral) el objetivo se corre a la izquierda del contenido', () => {
      const pts = [fromLocal([-100, 0]), fromLocal([100, 0])]
      const sinRelleno = fitCamera({ ...base, points: pts, padding: none })
      const conBarra = fitCamera({ ...base, points: pts, padding: { ...none, left: 200 } })
      // El contenido debe verse a la derecha del centro del lienzo, así que la cámara mira más a la izquierda.
      expect(conBarra.target[0]).toBeLessThan(sinRelleno.target[0])
      expect(conBarra.distance).toBeGreaterThan(sinRelleno.distance)
    })

    it('un contenido más grande necesita más distancia, dentro de los límites', () => {
      const small = fitCamera({ ...base, points: [fromLocal([-50, -50]), fromLocal([50, 50])], padding: none })
      const big = fitCamera({ ...base, points: [fromLocal([-500, -500]), fromLocal([500, 500])], padding: none })
      expect(big.distance).toBeGreaterThan(small.distance)
      expect(small.distance).toBeGreaterThanOrEqual(MIN_DISTANCE)
      expect(big.distance).toBeLessThanOrEqual(MAX_DISTANCE)
      expect(campus).toBeDefined()
    })
  })
})
