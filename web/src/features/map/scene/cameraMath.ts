import { Vector3, type Camera } from 'three'
import { CAMPUS, type LngLat } from '../constants/campus'
import { campusOsm } from '../data/campusData'
import { toLocal, type Local } from '../utils/projection'

/** Campo de visión vertical de la cámara (grados). */
export const FOV = 40
/** Distancia de la cámara (m) que equivale al zoom 16 de Mapbox, el de la vista inicial. */
export const BASE_DISTANCE = 1400
export const BASE_ZOOM = 16
export const MIN_DISTANCE = 40
export const MAX_DISTANCE = 2800
/** Inclinación máxima (grados desde la vertical). */
export const MAX_POLAR_DEG = 75
/** Por debajo de esta inclinación (grados) la vista se considera plana (2D). */
export const FLAT_POLAR_DEG = 1
/** Metros que se puede explorar fuera del contorno del campus. */
export const BOUNDS_MARGIN = 150

/** Por encima de esta distancia (m) solo se ven los puntos de los lugares, sin nombres. */
export const LABEL_MAX_DISTANCE = 900

/** Inclinación de la vista 3D (grados desde la vertical): más baja se ve más de lado y los nombres se solapan. */
export const TILT_3D_DEG = 50

export const deg = (d: number) => (d * Math.PI) / 180

/**
 * Punto del suelo (y = 0) que se ve en la posición `ndc` de la pantalla (−1 a 1, con y hacia arriba).
 * `null` si ese punto del cielo no toca el suelo (se mira por encima del horizonte).
 */
export function groundPointAt(camera: Camera, ndcX: number, ndcY: number): Vector3 | null {
  camera.updateMatrixWorld()
  const direction = new Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position)
  if (direction.y >= -1e-6) return null
  return camera.position.clone().addScaledVector(direction, -camera.position.y / direction.y)
}

/** Zoom estilo Mapbox → distancia de la cámara (m); cada zoom duplica o reduce a la mitad la distancia. */
export function zoomToDistance(zoom: number): number {
  return clampDistance(BASE_DISTANCE * 2 ** (BASE_ZOOM - zoom))
}

export const clampDistance = (d: number) => Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, d))

export interface Box {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Puntos del contorno del campus (lng/lat). */
export const campusPoints = (): LngLat[] => campusOsm.boundary.flat(2)

/** Centro del contorno del campus, en metros locales. */
function campusCenter(): Local {
  const box = localBox(campusPoints())
  return [(box.minX + box.maxX) / 2, (box.minZ + box.maxZ) / 2]
}

/** Vista inicial del campus: inclinada (3D). `polar` es el ángulo desde la vertical, en radianes. */
export const CAMPUS_VIEW = {
  target: campusCenter(),
  distance: BASE_DISTANCE,
  polar: deg(TILT_3D_DEG),
  azimuth: deg(-CAMPUS.camera.bearing),
}

/** Caja local que contiene un conjunto de puntos lng/lat. */
export function localBox(points: LngLat[]): Box {
  const box: Box = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  for (const p of points) {
    const [x, z] = toLocal(p)
    box.minX = Math.min(box.minX, x)
    box.maxX = Math.max(box.maxX, x)
    box.minZ = Math.min(box.minZ, z)
    box.maxZ = Math.max(box.maxZ, z)
  }
  return box
}

/** Límites de la cámara: el contorno del campus más un margen, ampliados para incluir un punto extra (RF-40.6). */
export function cameraBounds(extra: LngLat | null = null): Box {
  const box = localBox(campusPoints())
  box.minX -= BOUNDS_MARGIN
  box.maxX += BOUNDS_MARGIN
  box.minZ -= BOUNDS_MARGIN
  box.maxZ += BOUNDS_MARGIN
  if (extra) {
    const [x, z] = toLocal(extra)
    box.minX = Math.min(box.minX, x - BOUNDS_MARGIN)
    box.maxX = Math.max(box.maxX, x + BOUNDS_MARGIN)
    box.minZ = Math.min(box.minZ, z - BOUNDS_MARGIN)
    box.maxZ = Math.max(box.maxZ, z + BOUNDS_MARGIN)
  }
  return box
}

export function clampToBox([x, z]: Local, box: Box): Local {
  return [Math.min(box.maxX, Math.max(box.minX, x)), Math.min(box.maxZ, Math.max(box.minZ, z))]
}

export interface Padding {
  top: number
  bottom: number
  left: number
  right: number
}

export interface FitInput {
  points: LngLat[]
  padding: Padding
  /** Tamaño del lienzo en píxeles. */
  width: number
  height: number
  polar: number
  azimuth: number
  maxDistance?: number
}

/**
 * Cámara que deja todos los puntos dentro del área libre (el lienzo menos el relleno),
 * centrados en ella y manteniendo la inclinación y la orientación (RF-40.11).
 */
export function fitCamera({ points, padding, width, height, polar, azimuth, maxDistance }: FitInput) {
  const locals = points.map(toLocal)
  const cos = Math.cos(azimuth)
  const sin = Math.sin(azimuth)
  // Ejes del suelo alineados con la pantalla: derecha r = (cos, -sin), adelante f = (-sin, -cos).
  const rs = locals.map(([x, z]) => x * cos - z * sin)
  const fs = locals.map(([x, z]) => -x * sin - z * cos)
  const minR = Math.min(...rs)
  const maxR = Math.max(...rs)
  const minF = Math.min(...fs)
  const maxF = Math.max(...fs)
  const centerR = (minR + maxR) / 2
  const centerF = (minF + maxF) / 2

  const freeW = Math.max(1, width - padding.left - padding.right)
  const freeH = Math.max(1, height - padding.top - padding.bottom)
  const tan = Math.tan(deg(FOV) / 2)
  const aspect = width / height
  const dx = (maxR - minR) / (2 * tan * aspect * (freeW / width))
  const dy = ((maxF - minF) * Math.cos(polar)) / (2 * tan * (freeH / height))
  // Con la vista inclinada la perspectiva ensancha lo cercano: un margen extra evita cortar los bordes.
  const margin = 1 + 0.3 * Math.sin(polar)
  const distance = Math.min(maxDistance ?? MAX_DISTANCE, clampDistance(Math.max(dx, dy) * margin))

  // Píxel → metros en el suelo a esa distancia; el centro del contenido debe caer en el centro del área libre.
  const mpp = (2 * distance * tan) / height
  const offsetX = (padding.left - padding.right) / 2
  const offsetY = (padding.top - padding.bottom) / 2
  const targetR = centerR - offsetX * mpp
  const targetF = centerF + (offsetY * mpp) / Math.max(0.2, Math.cos(polar))
  const target: Local = [targetR * cos - targetF * sin, -targetR * sin - targetF * cos]
  return { target, distance }
}

/** Posición de la cámara para un objetivo, distancia y ángulos (esféricas alrededor del objetivo). */
export function cameraPosition(target: Local, distance: number, polar: number, azimuth: number): [number, number, number] {
  return [
    target[0] + distance * Math.sin(polar) * Math.sin(azimuth),
    distance * Math.cos(polar),
    target[1] + distance * Math.sin(polar) * Math.cos(azimuth),
  ]
}

/** ¿El punto (metros locales) está dentro del contorno del campus? */
export function insideCampus([x, z]: Local): boolean {
  return campusRings().some((ring) => {
    let c = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i]
      const [xj, zj] = ring[j]
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
    }
    return c
  })
}

let rings: Local[][] | null = null
/** Anillos exteriores del contorno, en metros locales (se calcula una vez). */
export function campusRings(): Local[][] {
  rings ??= campusOsm.boundary.map((polygon) => polygon[0].map(toLocal))
  return rings
}
