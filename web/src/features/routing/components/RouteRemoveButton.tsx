import { Marker, useMap } from 'react-map-gl/mapbox'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { useRouteStore } from '../store/useRouteStore'

/** «X» flotante junto al punto de la ruta bajo el cursor/dedo; quita la ruta. Va desplazada para no quedar tapada. */
export function RouteRemoveButton() {
  const route = useRouteStore((s) => s.activeRoute)
  const hover = useRouteStore((s) => s.routeHover)
  const { current: map } = useMap()
  if (!route || !hover) return null

  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  // Escritorio: en diagonal, pegada al punto, para que no quede sobre una línea vertical ni lejos del cursor.
  // Táctil: justo encima de la yema del dedo.
  const gap = coarse ? 44 : 10
  // Cerca del borde superior no cabe arriba: se coloca debajo.
  const below = (map?.project(hover).y ?? Infinity) < 80
  const anchor = coarse ? (below ? 'top' : 'bottom') : below ? 'top-left' : 'bottom-left'

  return (
    <Marker longitude={hover[0]} latitude={hover[1]} anchor={anchor} offset={coarse ? [0, below ? gap : -gap] : [gap, below ? gap : -gap]}>
      <div
        onMouseEnter={() => useRouteStore.getState().cancelHide()}
        onMouseLeave={() => useRouteStore.getState().scheduleHide()}
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
    </Marker>
  )
}
