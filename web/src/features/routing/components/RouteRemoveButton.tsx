import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { toLocal } from '@/features/map/utils/projection'
import { useRouteStore } from '../store/useRouteStore'

/** «X» flotante junto al punto de la ruta bajo el cursor/dedo; quita la ruta. Va desplazada para no quedar tapada. */
export function RouteRemoveButton() {
  const route = useRouteStore((s) => s.activeRoute)
  const hover = useRouteStore((s) => s.routeHover)
  const camera = useThree((s) => s.camera)
  const height = useThree((s) => s.size.height)
  if (!route || !hover) return null

  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  const gap = coarse ? 44 : 10
  const [x, z] = toLocal(hover)
  // Cerca del borde superior no cabe arriba: se coloca debajo.
  const screenY = ((1 - new Vector3(x, 0.5, z).project(camera).y) / 2) * height
  const below = screenY < 80
  const transform = coarse
    ? `translate(-50%, ${below ? `${gap}px` : `calc(-100% - ${gap}px)`})`
    : `translate(${gap}px, ${below ? `${gap}px` : `calc(-100% - ${gap}px)`})`

  return (
    <Html position={[x, 0.5, z]} zIndexRange={[20, 10]}>
      <div
        style={{ transform }}
        onPointerEnter={() => useRouteStore.getState().cancelHide()}
        onPointerLeave={() => useRouteStore.getState().scheduleHide()}
        className="animate-pop-in"
      >
        <IconButton
          label="Quitar ruta"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation()
            useRouteStore.getState().clearActiveRoute()
          }}
        >
          <X size={16} />
        </IconButton>
      </div>
    </Html>
  )
}
