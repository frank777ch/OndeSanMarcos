import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { ROUTE_COLOR } from '@/features/routing/constants/route'
import { fromLocal, toLocal } from '../utils/projection'
import { ORDER } from './order'
import { isCoarsePointer, setCursor } from './pointer'

const CASING = { normal: 9, hovered: 11 }
const LINE = { normal: 5, hovered: 7 }
const HIT_WIDTH = 22
/** Si el cursor sigue a menos de estos px de la «X», esta no se reubica: así se puede llegar a ella. */
const KEEP_PX = 90
const TOUCH_HIDE_MS = 4000

/** Línea de la ruta iniciada, sin marcadores. Al pasar el cursor o tocarla muestra la «X» (RF-40.11, RF-40.12). */
export function RouteLine() {
  const route = useRouteStore((s) => s.activeRoute)
  const hovered = useRouteStore((s) => s.routeHover !== null)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const points = useMemo(
    () =>
      route
        ? route.path.map((c) => {
            const [x, z] = toLocal(c)
            return [x, 0.5, z] as [number, number, number]
          })
        : null,
    [route],
  )

  if (!route || !points || points.length < 2) return null

  const screenOf = (lngLat: [number, number]) => {
    const [x, z] = toLocal(lngLat)
    const v = new Vector3(x, 0.5, z).project(camera)
    return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height }
  }

  const show = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const { routeHover, setRouteHover, cancelHide } = useRouteStore.getState()
    const next = fromLocal([e.point.x, e.point.z])
    const shown = routeHover && screenOf(routeHover)
    const native = e.nativeEvent as MouseEvent
    // La «X» se queda donde apareció; solo se reubica si el cursor ya se alejó mucho.
    if (shown && Math.hypot(shown.x - native.offsetX, shown.y - native.offsetY) < KEEP_PX) cancelHide()
    else setRouteHover(next)
  }

  return (
    <>
      <Line points={points} color="#ffffff" lineWidth={hovered ? CASING.hovered : CASING.normal} depthTest={false} renderOrder={ORDER.overlay} />
      <Line points={points} color={ROUTE_COLOR} lineWidth={hovered ? LINE.hovered : LINE.normal} depthTest={false} renderOrder={ORDER.overlay + 1} />
      {/* Zona de toque ancha e invisible; la ruta tiene prioridad sobre los lugares (RF-40.12). */}
      <Line
        points={points}
        color="#000000"
        lineWidth={HIT_WIDTH}
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        renderOrder={ORDER.overlay + 2}
        userData={{ routeHover: true, routeHit: true }}
        onPointerOver={() => setCursor(gl.domElement, 'pointer')}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          // En táctil el toque fija la «X»; arrastrar el mapa no debe reubicarla.
          if (e.pointerType === 'touch') return
          show(e)
        }}
        onPointerOut={() => {
          setCursor(gl.domElement, '')
          useRouteStore.getState().scheduleHide()
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          useRouteStore.getState().setRouteHover(fromLocal([e.point.x, e.point.z]))
          if (isCoarsePointer()) useRouteStore.getState().scheduleHide(TOUCH_HIDE_MS)
        }}
      />
    </>
  )
}
