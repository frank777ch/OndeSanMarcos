import { CAMPUS } from '../constants/campus'
import { buildingsGeometry, flatGeometry, ribbonGeometry } from './geometry'

const [lng, lat] = CAMPUS.center
const square = [[[lng, lat], [lng + 0.0002, lat], [lng + 0.0002, lat + 0.0002], [lng, lat + 0.0002], [lng, lat]]] as [number, number][][]

describe('geometry', () => {
  it('flatGeometry: polígono plano en y = 0', () => {
    const g = flatGeometry([square])!
    g.computeBoundingBox()
    expect(g.boundingBox!.min.y).toBeCloseTo(0)
    expect(g.boundingBox!.max.y).toBeCloseTo(0)
    expect(g.getAttribute('position').count).toBeGreaterThanOrEqual(6)
  })

  it('RF-40.2: los edificios suben hasta su altura', () => {
    const g = buildingsGeometry([{ footprint: square, height: 12 }])!
    g.computeBoundingBox()
    expect(g.boundingBox!.min.y).toBeCloseTo(0)
    expect(g.boundingBox!.max.y).toBeCloseTo(12)
  })

  it('el norte queda en -z (la huella apunta al mismo lado que el mapa)', () => {
    const g = flatGeometry([square])!
    g.computeBoundingBox()
    expect(g.boundingBox!.min.z).toBeLessThan(0)
  })

  it('ribbonGeometry: una cinta por tramo y vacío sin tramos', () => {
    const g = ribbonGeometry([[[lng, lat], [lng + 0.0001, lat], [lng + 0.0002, lat]]], 3)!
    expect(g.getAttribute('position').count).toBe(12)
    expect(ribbonGeometry([[[lng, lat]]], 3)).toBeNull()
  })

  it('ribbonGeometry: las cintas miran hacia arriba (si no, se ven desde abajo y desaparecen)', () => {
    const g = ribbonGeometry([[[lng, lat], [lng + 0.0002, lat]], [[lng, lat], [lng, lat + 0.0002]]], 3)!
    const normals = g.getAttribute('normal')
    for (let i = 0; i < normals.count; i++) expect(normals.getY(i)).toBeGreaterThan(0.99)
  })

  it('ignora polígonos inválidos', () => {
    expect(flatGeometry([[[[lng, lat]]]])).toBeNull()
  })
})
