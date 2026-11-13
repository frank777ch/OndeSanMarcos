import { useEffect, useRef, type RefObject } from 'react'
import { viewPadding } from '@/features/map/utils/viewPadding'
import { useCameraStore } from '@/features/map/scene/cameraStore'
import { useRouteStore } from '../store/useRouteStore'

const MAX_ZOOM = 19

/**
 * Cuando se inicia una ruta, la cámara vuela hasta dejarla entera y centrada en el área visible
 * del mapa, conservando la inclinación y la orientación actuales (RF-40.11).
 */
export function FlyToRoute({ container }: { container: RefObject<HTMLElement | null> }) {
  const route = useRouteStore((s) => s.activeRoute)
  // Una ruta que ya estaba al entrar a la vista no mueve la cámara; solo las que se inician después.
  const seen = useRef(route)

  useEffect(() => {
    if (route === seen.current) return
    seen.current = route
    if (!route) return
    const el = container.current
    useCameraStore.getState().fitPoints(
      route.path,
      viewPadding(el),
      { maxZoom: MAX_ZOOM, duration: 2000 },
    )
  }, [route, container])

  return null
}
