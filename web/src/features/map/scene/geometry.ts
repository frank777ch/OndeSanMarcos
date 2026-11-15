import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { LngLat } from '../constants/campus'
import type { Polygon } from '../data/campusData'
import { toLocal } from '../utils/projection'

/** Anillo lng/lat → puntos (x, -z): al girar la geometría -90° sobre X, el eje y de la forma pasa a z. */
const ringPoints = (ring: LngLat[]) => ring.map((p) => {
  const [x, z] = toLocal(p)
  return { x, y: -z }
})

/** Forma de Three.js de un polígono (anillo exterior + huecos), en el plano XY. */
export function polygonShape(polygon: Polygon): Shape {
  const [outer, ...holes] = polygon
  const shape = new Shape()
  const pts = ringPoints(outer)
  shape.moveTo(pts[0].x, pts[0].y)
  for (const p of pts.slice(1)) shape.lineTo(p.x, p.y)
  for (const hole of holes) {
    const path = new Path()
    const hp = ringPoints(hole)
    path.moveTo(hp[0].x, hp[0].y)
    for (const p of hp.slice(1)) path.lineTo(p.x, p.y)
    shape.holes.push(path)
  }
  return shape
}

const valid = (polygon: Polygon) => polygon[0] && polygon[0].length >= 4

function merge(parts: BufferGeometry[]): BufferGeometry | null {
  if (!parts.length) return null
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))
}

/** Polígonos planos (suelo, verde) en y = 0, fusionados en una sola malla. */
export function flatGeometry(polygons: Polygon[]): BufferGeometry | null {
  const parts = polygons.filter(valid).map((p) => {
    const g = new ShapeGeometry(polygonShape(p))
    g.rotateX(-Math.PI / 2)
    return g
  })
  return merge(parts)
}

/** Edificios extruidos hasta su altura, fusionados en una sola malla. */
export function buildingsGeometry(buildings: { footprint: Polygon; height: number }[]): BufferGeometry | null {
  const parts = buildings
    .filter((b) => valid(b.footprint))
    .map((b) => {
      const g = new ExtrudeGeometry(polygonShape(b.footprint), { depth: b.height, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      return g
    })
  return merge(parts)
}

/** Cintas planas de ancho `width` (m) a lo largo de las líneas, en y = 0; cada tramo se alarga media anchura para tapar las uniones. */
export function ribbonGeometry(lines: LngLat[][], width: number): BufferGeometry | null {
  const positions: number[] = []
  const half = width / 2
  for (const line of lines) {
    const pts = line.map(toLocal)
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i]
      const [bx, bz] = pts[i + 1]
      const dx = bx - ax
      const dz = bz - az
      const len = Math.hypot(dx, dz)
      if (len < 1e-6) continue
      const ux = dx / len
      const uz = dz / len
      const nx = -uz * half
      const nz = ux * half
      const sx = ax - ux * half
      const sz = az - uz * half
      const ex = bx + ux * half
      const ez = bz + uz * half
      positions.push(
        sx + nx, 0, sz + nz,
        ex - nx, 0, ez - nz,
        sx - nx, 0, sz - nz,
        sx + nx, 0, sz + nz,
        ex + nx, 0, ez + nz,
        ex - nx, 0, ez - nz,
      )
    }
  }
  if (!positions.length) return null
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.computeVertexNormals()
  return g
}
