import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useRouteStore } from '../store/useRouteStore'

export const ROUTE_COLOR = '#3056ac'

/** Línea de la ruta iniciada. Se monta dentro de `<Map>`; sin marcadores ni movimiento de cámara. */
export function RouteLayer() {
  const route = useRouteStore((s) => s.activeRoute)
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

  // Fuera de `interactiveLayerIds`: no captura toques sobre los lugares (RF-13.39).
  return (
    <Source id="route" type="geojson" data={data}>
      <Layer
        id="route-casing"
        type="line"
        slot="top"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#ffffff', 'line-width': 9 }}
      />
      <Layer
        id="route-line"
        type="line"
        slot="top"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': ROUTE_COLOR, 'line-width': 5 }}
      />
    </Source>
  )
}
