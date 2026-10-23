import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { PLACES } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import { filterPlaces, placesToGeoJSON, selectedFilter } from '../utils/places'

/** Puntos de los lugares del campus, filtrados por la categoría activa. */
export function PlacesLayer() {
  const activeCategory = useMapStore((s) => s.activeCategory)
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)
  const data = useMemo(
    () => placesToGeoJSON(filterPlaces(PLACES, activeCategory)),
    [activeCategory],
  )

  return (
    <Source id="places" type="geojson" data={data}>
      <Layer
        id="places-selected"
        type="circle"
        slot="top"
        filter={selectedFilter(selectedPlaceId)}
        paint={{
          'circle-radius': 16,
          'circle-opacity': 0,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#0a0a0a',
        }}
      />
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
