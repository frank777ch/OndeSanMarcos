import { useEffect } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { useMapStore } from '../store/useMapStore'
import { ORDER } from './order'
import { hitsRoute, setCursor } from './pointer'
import { ScreenScale } from './ScreenScale'
import { useVisiblePlaces } from './useVisiblePlaces'

const DOT_PX = 8
const HIT_PX = 16

/** Si bajo el toque también hay ruta, el lugar no se elige (RF-40.12). */
const underRoute = (e: ThreeEvent<MouseEvent | PointerEvent>) => hitsRoute(e.intersections)

/** Puntos de los lugares, filtrados por la categoría activa. Tocar uno lo elige (RF-40.9). Los nombres van aparte (PlaceLabels). */
export function PlaceMarkers() {
  const selectPlace = useMapStore((s) => s.selectPlace)
  const gl = useThree((s) => s.gl)
  const visible = useVisiblePlaces()

  // Al desmontar, el cursor vuelve a la normalidad.
  useEffect(() => () => setCursor(gl.domElement, ''), [gl])

  return (
    <>
      {visible.map((p) => (
        <ScreenScale key={p.id} position={p.position}>
          <mesh
            renderOrder={ORDER.overlay}
            onClick={(e) => {
              if (underRoute(e)) return
              e.stopPropagation()
              useRouteStore.getState().setRouteHover(null)
              selectPlace(p.id, 'map')
            }}
            onPointerOver={(e) => {
              if (underRoute(e)) return
              setCursor(gl.domElement, 'pointer')
            }}
            onPointerOut={() => setCursor(gl.domElement, '')}
          >
            <circleGeometry args={[HIT_PX, 20]} />
            <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} />
          </mesh>
          <mesh renderOrder={ORDER.overlay + 1} raycast={() => null}>
            <circleGeometry args={[DOT_PX, 24]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
          </mesh>
          <mesh renderOrder={ORDER.overlay + 2} raycast={() => null}>
            <circleGeometry args={[DOT_PX - 2, 24]} />
            <meshBasicMaterial color={p.color} depthTest={false} depthWrite={false} />
          </mesh>
        </ScreenScale>
      ))}
    </>
  )
}
