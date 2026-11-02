import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/mapbox'
import { useRouteStore } from '../store/useRouteStore'
import { routeBounds } from '../utils/routeBounds'

const EDGE_PADDING = 80
/** Espacio extra arriba para el buscador y los filtros, y abajo para el logo de Mapbox. */
const TOP_PADDING = 140
const BOTTOM_PADDING = 100
const MAX_ZOOM = 19

/** Ancho (px) de la barra lateral, que va encima del mapa. Se lee de `--sidebar-w`. */
function sidebarWidth(el: HTMLElement): number {
  const raw = getComputedStyle(el).getPropertyValue('--sidebar-w').trim()
  const value = parseFloat(raw)
  if (Number.isNaN(value)) return 0
  if (raw.endsWith('rem')) return value * parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
  return value
}

/**
 * Cuando se inicia una ruta, la cámara vuela hasta dejarla entera y centrada en
 * el área visible del mapa. Fija la inclinación y la orientación actuales (por defecto `fitBounds` las reinicia).
 * Se monta dentro de `<Map>`.
 */
export function FlyToRoute() {
  const { current: map } = useMap()
  const route = useRouteStore((s) => s.activeRoute)
  // Una ruta que ya estaba al entrar a la vista no mueve la cámara; solo las que se inician después.
  const seen = useRef(route)

  useEffect(() => {
    if (route === seen.current) return
    seen.current = route
    if (!map || !route) return
    map.fitBounds(routeBounds(route.path), {
      padding: {
        top: TOP_PADDING,
        bottom: BOTTOM_PADDING,
        right: EDGE_PADDING,
        left: EDGE_PADDING + sidebarWidth(map.getContainer()),
      },
      // fitBounds endereza el mapa por defecto: se fijan la inclinación y la orientación actuales (RF-13.42).
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      maxZoom: MAX_ZOOM,
      duration: 2000,
      essential: true,
    })
  }, [map, route])

  return null
}
