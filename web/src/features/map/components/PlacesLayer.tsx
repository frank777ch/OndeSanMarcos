import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'
import { filterPlaces, placesToGeoJSON } from '../utils/places'

/** Puntos de los lugares del campus, filtrados por la categoría activa. */
export function PlacesLayer() {
  const activeCategory = useMapStore((s) => s.activeCategory)
  const status = usePlacesStore((s) => s.status)
  const places = usePlacesStore((s) => s.places)
  const categories = usePlacesStore((s) => s.categories)
  const data = useMemo(
    () => placesToGeoJSON(filterPlaces(places, activeCategory), categories),
    [places, categories, activeCategory],
  )

  // Sin datos (cargando o con error) no se dibuja nada (RF-28.3).
  if (status !== 'ready') return null

  return (
    <Source id="places" type="geojson" data={data}>
      <Layer
        id="places-circles"
        type="circle"
        slot="top"
        paint={{
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        }}
      />
      <Layer
        id="places-labels"
        type="symbol"
        slot="top"
        layout={{
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-max-width': 9,
        }}
        paint={{
          'text-color': '#0a0a0a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        }}
      />
    </Source>
  )
}
