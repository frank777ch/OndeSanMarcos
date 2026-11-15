import { Line } from '@react-three/drei'
import campusPaths from '@/features/routing/data/campus-paths.json'
import type { LngLat } from '../constants/campus'
import { campusOsm } from '../data/campusData'
import { toLocal } from '../utils/projection'
import type { FeatureCollection, LineString } from 'geojson'
import { ORDER } from './order'
import { buildingsGeometry, flatGeometry, ribbonGeometry } from './geometry'
import type { MapColors } from './useMapColors'

const PATH_WIDTH = 3

/** Calcula una vez, la primera vez que se pide: la geometría no cambia y no debe rehacerse al volver al mapa. */
function once<T>(fn: () => T): () => T {
  let done = false
  let value: T
  return () => {
    if (!done) {
      value = fn()
      done = true
    }
    return value
  }
}

const groundGeometry = once(() => flatGeometry(campusOsm.boundary))

const greenParts = once(() =>
  (['grass', 'park', 'pitch', 'water'] as const).map((kind) => ({
    kind,
    geometry: flatGeometry(campusOsm.green.filter((g) => g.kind === kind).map((g) => g.polygon)),
  })),
)

const pathsGeometry = once(() => {
  const lines = (campusPaths as FeatureCollection<LineString>).features.map((f) => f.geometry.coordinates as LngLat[])
  return ribbonGeometry(lines, PATH_WIDTH)
})

/** Suelo del campus (el contorno relleno). Fuera de él solo se ve el fondo liso. */
export function Ground({ colors }: { colors: MapColors }) {
  const geometry = groundGeometry()
  if (!geometry) return null
  return (
    <mesh geometry={geometry} renderOrder={ORDER.ground} raycast={() => null}>
      <meshBasicMaterial color={colors.ground} depthWrite={false} />
    </mesh>
  )
}

/** Áreas verdes, canchas y agua, planas sobre el suelo. */
export function GreenAreas({ colors }: { colors: MapColors }) {
  const parts = greenParts()
  const color = { grass: colors.green, park: colors.green, pitch: colors.pitch, water: colors.water }
  return (
    <>
      {parts.map(
        ({ kind, geometry }) =>
          geometry && (
            <mesh key={kind} geometry={geometry} renderOrder={ORDER.green} raycast={() => null}>
              <meshBasicMaterial color={color[kind]} depthWrite={false} />
            </mesh>
          ),
      )}
    </>
  )
}

/** Caminos del campus: los mismos del grafo con el que se calculan las rutas (RF-40.4). */
export function Paths({ colors }: { colors: MapColors }) {
  const geometry = pathsGeometry()
  if (!geometry) return null
  return (
    <mesh geometry={geometry} renderOrder={ORDER.path} raycast={() => null}>
      <meshBasicMaterial color={colors.path} depthWrite={false} />
    </mesh>
  )
}

/** Ancho (m) con que se dibuja cada clase de vía. */
const ROAD_WIDTH: Record<string, number> = { motorway: 16, trunk: 16, primary: 14, secondary: 11, tertiary: 9 }
const ROAD_WIDTH_DEFAULT = 6

/** Avenidas y calles que rodean al campus, solo unos metros más allá del contorno (RF-40.20). */
const roadParts = once(() => {
  const widths = [...new Set(campusOsm.roads.map((r) => ROAD_WIDTH[r.kind] ?? ROAD_WIDTH_DEFAULT))]
  return widths.map((width) => ({
    width,
    geometry: ribbonGeometry(
      campusOsm.roads.filter((r) => (ROAD_WIDTH[r.kind] ?? ROAD_WIDTH_DEFAULT) === width).map((r) => r.line),
      width,
    ),
  }))
})

export function Roads({ colors }: { colors: MapColors }) {
  const parts = roadParts()
  return (
    <>
      {parts.map(
        ({ width, geometry }) =>
          geometry && (
            <mesh key={width} geometry={geometry} renderOrder={ORDER.path} raycast={() => null}>
              <meshBasicMaterial color={colors.path} depthWrite={false} />
            </mesh>
          ),
      )}
    </>
  )
}

/** Contorno del campus como línea punteada (RF-40.8). */
const boundaryRings = once(() =>
  campusOsm.boundary.map((polygon) =>
    polygon[0].map((p) => {
      const [x, z] = toLocal(p)
      return [x, 0.2, z] as [number, number, number]
    }),
  ),
)

export function Boundary({ colors }: { colors: MapColors }) {
  const rings = boundaryRings()
  return (
    <>
      {rings.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={colors.boundary}
          lineWidth={2}
          dashed
          dashSize={7}
          gapSize={6}
          depthTest={false}
          renderOrder={ORDER.boundary}
        />
      ))}
    </>
  )
}

const buildingGeometry = once(() => buildingsGeometry(campusOsm.buildings))

/** Edificios como bloques con su altura, con el contorno marcado. */
export function Buildings({ colors }: { colors: MapColors }) {
  const geometry = buildingGeometry()
  if (!geometry) return null
  return (
    <group renderOrder={ORDER.buildings}>
      <mesh geometry={geometry} raycast={() => null}>
        <meshLambertMaterial color={colors.building} />
      </mesh>
      <lineSegments raycast={() => null}>
        <edgesGeometry args={[geometry, 35]} />
        <lineBasicMaterial color={colors.buildingEdge} />
      </lineSegments>
    </group>
  )
}
