import { useMemo } from 'react'
import { useLocationStore } from '../store/useLocationStore'
import { toLocal } from '../utils/projection'
import { USER_DOT_COLOR } from '../utils/userLocation'
import { ORDER } from './order'
import { ScreenScale } from './ScreenScale'

/** Radio mínimo del halo (px) para que nunca quede tapado por el punto. */
const MIN_HALO_PX = 14

/** Punto azul con borde blanco y halo de precisión (RF-40.13). No captura toques. */
export function UserLocation() {
  const position = useLocationStore((s) => s.position)
  const local = useMemo(() => (position ? toLocal(position.coordinates) : null), [position])
  if (!position || !local) return null

  return (
    <>
      {/* Halo de precisión en metros sobre el suelo. */}
      <mesh position={[local[0], 0.3, local[1]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={ORDER.overlay} raycast={() => null}>
        <circleGeometry args={[Math.max(position.accuracy, 1), 48]} />
        <meshBasicMaterial color={USER_DOT_COLOR} transparent opacity={0.2} depthTest={false} depthWrite={false} />
      </mesh>
      <ScreenScale position={[local[0], 1, local[1]]}>
        <mesh renderOrder={ORDER.overlay + 1} raycast={() => null}>
          <circleGeometry args={[MIN_HALO_PX, 32]} />
          <meshBasicMaterial color={USER_DOT_COLOR} transparent opacity={0.15} depthTest={false} depthWrite={false} />
        </mesh>
        <mesh renderOrder={ORDER.overlay + 2} raycast={() => null}>
          <circleGeometry args={[9.5, 32]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
        </mesh>
        <mesh renderOrder={ORDER.overlay + 3} raycast={() => null}>
          <circleGeometry args={[7, 32]} />
          <meshBasicMaterial color={USER_DOT_COLOR} depthTest={false} depthWrite={false} />
        </mesh>
      </ScreenScale>
    </>
  )
}
