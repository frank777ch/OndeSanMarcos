import { useRef } from 'react'
import Map, { NavigationControl, type MapRef } from 'react-map-gl/mapbox'
import { LocateFixed } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Config } from '@/config'
import { IconButton } from '@/components/IconButton/IconButton'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '../constants/campus'
import { FlyToSelection } from './FlyToSelection'
import { MapToolbar } from './MapToolbar'
import { PlacesLayer } from './PlacesLayer'
import styles from './CampusMap.module.css'

const MAP_STYLE = 'mapbox://styles/mapbox/standard'

export function CampusMap() {
  const mapRef = useRef<MapRef>(null)

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
      <div className={styles.missing} role="alert">
        <h2>Falta el token de Mapbox</h2>
        <p>
          Define <code>VITE_MAPBOX_TOKEN</code> en <code>web/.env</code> con un token
          público (empieza con <code>pk.</code>) y reinicia el servidor.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
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
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" visualizePitch />
        <PlacesLayer />
        <FlyToSelection />
      </Map>
      <MapToolbar />
      <div className={styles.actions}>
        <IconButton label="Volver al campus" onClick={backToCampus}>
          <LocateFixed size={20} />
        </IconButton>
      </div>
    </div>
  )
}
