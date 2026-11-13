import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useRouteStore } from '../store/useRouteStore'

export const ROUTE_COLOR = '#3056ac'
/** Capa invisible y ancha: zona de hover/toque de la ruta. */
export const ROUTE_HIT_LAYER = 'route-hit'

/** Línea de la ruta iniciada. Se monta dentro de `<Map>`; sin marcadores ni movimiento de cámara. */
export function RouteLayer() {
  const route = useRouteStore((s) => s.activeRoute)
  const hovered = useRouteStore((s) => s.routeHover !== null)
  const data = useMemo(
    () =>
      route
        ? ({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: route.path },
          } as const)
        : null,
    [route],
  )

  if (!data) return null

  // La ruta tiene prioridad sobre los lugares: `route-hit` es interactiva y CampusMap la comprueba primero.
  return (
    <Source id="route" type="geojson" data={data}>
      <Layer
        id="route-casing"
        type="line"
        slot="top"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#ffffff', 'line-width': hovered ? 11 : 9 }}
      />
      <Layer
        id="route-line"
        type="line"
        slot="top"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': ROUTE_COLOR, 'line-width': hovered ? 7 : 5 }}
      />
      <Layer
        id={ROUTE_HIT_LAYER}
        type="line"
        slot="top"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#000000', 'line-width': 22, 'line-opacity': 0 }}
      />
    </Source>
  )
}
