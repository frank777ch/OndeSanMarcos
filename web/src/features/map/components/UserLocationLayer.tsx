import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useLocationStore } from '../store/useLocationStore'
import {
  haloRadiusStops,
  USER_DOT_COLOR,
  userLocationToGeoJSON,
} from '../utils/userLocation'

/** Punto azul con borde blanco y halo de precisión. Se monta dentro de `<Map>`. */
export function UserLocationLayer() {
  const position = useLocationStore((s) => s.position)
  const data = useMemo(() => (position ? userLocationToGeoJSON(position) : null), [position])
  const haloRadius = useMemo(
    () =>
      position
        ? ([
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            ...haloRadiusStops(position.accuracy, position.coordinates[1]).flat(),
          ] as unknown as number)
        : 0,
    [position],
  )

  if (!data) return null

  // Fuera de `interactiveLayerIds`: no captura toques sobre los lugares (RF-15.18).
  return (
    <Source id="user-location" type="geojson" data={data}>
      <Layer
        id="user-location-halo"
        type="circle"
        slot="top"
        paint={{
          'circle-radius': haloRadius,
          'circle-color': USER_DOT_COLOR,
          'circle-opacity': 0.2,
          'circle-pitch-alignment': 'map',
        }}
      />
      <Layer
        id="user-location-dot"
        type="circle"
        slot="top"
        paint={{
          'circle-radius': 8,
          'circle-color': USER_DOT_COLOR,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        }}
      />
    </Source>
  )
}
