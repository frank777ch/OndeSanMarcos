import { useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import type { Vector3Tuple } from 'three'
import { deg, FOV } from './cameraMath'

/**
 * Grupo que mide siempre `pixels` px por unidad y mira a la cámara: los puntos del mapa conservan
 * su tamaño al acercar o alejar y se ven de frente aunque la vista esté inclinada.
 */
export function ScreenScale({ position, pixels = 1, children }: { position: Vector3Tuple; pixels?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const height = useThree((s) => s.size.height)
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g) return
    const distance = camera.position.distanceTo(g.position)
    g.scale.setScalar(((2 * distance * Math.tan(deg(FOV) / 2)) / height) * pixels)
    g.quaternion.copy(camera.quaternion)
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}
