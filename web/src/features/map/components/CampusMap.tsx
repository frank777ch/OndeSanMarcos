import { useRef, useState } from 'react'
import Map, { NavigationControl, type MapRef } from 'react-map-gl/mapbox'
import { LocateFixed } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Config } from '@/config'
import { IconButton } from '@/components/IconButton/IconButton'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '../constants/campus'
import { useMapStore } from '../store/useMapStore'
import { placeIdFromFeatures } from '../utils/places'
import { FlyToSelection } from './FlyToSelection'
import { MapOverlay } from './MapOverlay'
import { PlacesLayer } from './PlacesLayer'

const MAP_STYLE = 'mapbox://styles/mapbox/standard'

export function CampusMap() {
  const mapRef = useRef<MapRef>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const [cursor, setCursor] = useState('')

  const backToCampus = () => {
    mapRef.current?.flyTo({
      center: CAMPUS.center,
      zoom: CAMPUS.camera.zoom,
      pitch: CAMPUS.camera.pitch,
      bearing: CAMPUS.camera.bearing,
      duration: 1500,
    })
  }

  if (!Config.mapbox.hasToken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted" role="alert">
        <h2 className="text-xl text-ink">Falta el token de Mapbox</h2>
        <p>
          Define <code className="rounded-sm bg-surface px-1.5 py-0.5">VITE_MAPBOX_TOKEN</code> en <code className="rounded-sm bg-surface px-1.5 py-0.5">web/.env</code> con un token
          público (empieza con <code className="rounded-sm bg-surface px-1.5 py-0.5">pk.</code>) y reinicia el servidor.
        </p>
      </div>
    )
  }

  return (
    <div className="relative size-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={Config.mapbox.token}
        mapStyle={MAP_STYLE}
        initialViewState={{
          longitude: CAMPUS.center[0],
          latitude: CAMPUS.center[1],
          zoom: CAMPUS.camera.zoom,
          pitch: CAMPUS.camera.pitch,
          bearing: CAMPUS.camera.bearing,
        }}
        maxBounds={CAMPUS_MAX_BOUNDS}
        minZoom={CAMPUS.minZoom}
        maxZoom={CAMPUS.maxZoom}
        maxPitch={75}
        interactiveLayerIds={['places-circles']}
        cursor={cursor}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('')}
        onClick={(e) => {
          // Tocar una zona sin lugares no cierra la ficha (RF-12.7).
          const id = placeIdFromFeatures(e.features)
          if (id) selectPlace(id, 'map')
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" visualizePitch />
        <PlacesLayer />
        <FlyToSelection />
      </Map>
      <MapOverlay />
      <div className="absolute right-4 bottom-8 flex flex-col gap-2">
        <IconButton label="Volver al campus" onClick={backToCampus}>
          <LocateFixed size={20} />
        </IconButton>
      </div>
    </div>
  )
}
