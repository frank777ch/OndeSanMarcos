import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { AttributionControl, type MapRef } from 'react-map-gl/mapbox'
import { Box, LoaderCircle, LocateFixed, Map as MapIcon } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Config } from '@/config'
import { IconButton } from '@/components/IconButton/IconButton'
import { useToastStore } from '@/components/Toast/toastStore'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '../constants/campus'
import { RouteButton } from '@/features/routing/components/RouteButton'
import { FlyToRoute } from '@/features/routing/components/FlyToRoute'
import { RouteLayer } from '@/features/routing/components/RouteLayer'
import { RouteDialog } from '@/features/routing/components/RouteDialog'
import { useLocationStore } from '../store/useLocationStore'
import { useMapStore } from '../store/useMapStore'
import { placeIdFromFeatures } from '../utils/places'
import { expandBounds } from '../utils/userLocation'
import { FlyToSelection } from './FlyToSelection'
import { LocationNotice } from './LocationNotice'
import { MapOverlay } from './MapOverlay'
import { PlacesLayer } from './PlacesLayer'
import { UserLocationLayer } from './UserLocationLayer'

const MAP_STYLE = 'mapbox://styles/mapbox/standard'
const LOCATION_ZOOM = 18
/** Por debajo de esta inclinación (grados) la vista se considera plana (2D). */
const FLAT_PITCH = 1

export function CampusMap() {
  const mapRef = useRef<MapRef>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const [cursor, setCursor] = useState('')
  const [flat, setFlat] = useState(false)
  const permission = useLocationStore((s) => s.permission)
  const position = useLocationStore((s) => s.position)
  const locating = useLocationStore((s) => s.locating)
  const hasLocationAccess = permission === 'granted'

  // Consulta el permiso al entrar al mapa; no mueve la cámara (RF-15.10).
  useEffect(() => useLocationStore.getState().init(), [])

  // Los límites del campus se amplían si la posición del usuario cae fuera (RF-15.16).
  const maxBounds = useMemo(
    () => (position ? expandBounds(CAMPUS_MAX_BOUNDS, position.coordinates) : CAMPUS_MAX_BOUNDS),
    [position],
  )

  const backToCampus = () => {
    mapRef.current?.flyTo({
      center: CAMPUS.center,
      zoom: CAMPUS.camera.zoom,
      pitch: CAMPUS.camera.pitch,
      bearing: CAMPUS.camera.bearing,
      duration: 1500,
    })
  }

  const goToMyLocation = async () => {
    const result = await useLocationStore.getState().locate()
    if (result) {
      // Se amplían los límites antes de volar, sin esperar al siguiente render.
      mapRef.current?.getMap().setMaxBounds(expandBounds(CAMPUS_MAX_BOUNDS, result.coordinates))
      mapRef.current?.flyTo({ center: result.coordinates, zoom: LOCATION_ZOOM, duration: 1500 })
      return
    }
    backToCampus()
    // Si el fallo fue por el permiso, el botón ya cambia de nombre: no hace falta el aviso.
    if (useLocationStore.getState().permission !== 'denied') {
      useToastStore
        .getState()
        .show('No pudimos obtener tu ubicación. Te llevamos al centro de la universidad.', 'error')
    }
  }

  // Alterna entre la vista inclinada del campus y la vista plana, sin mover centro, zoom ni orientación.
  const toggleView = () => {
    const nextFlat = !flat
    setFlat(nextFlat)
    mapRef.current?.easeTo({ pitch: nextFlat ? 0 : CAMPUS.camera.pitch, duration: 800 })
  }

  const onLocationButton = () => {
    if (hasLocationAccess) void goToMyLocation()
    else backToCampus()
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
        logoPosition="bottom-left"
        attributionControl={false}
        maxBounds={maxBounds}
        minZoom={CAMPUS.minZoom}
        maxZoom={CAMPUS.maxZoom}
        maxPitch={75}
        interactiveLayerIds={['places-circles']}
        cursor={cursor}
        // La etiqueta del botón sigue a la inclinación real, también si el usuario la cambia con el mouse.
        onPitchEnd={(e) => setFlat(e.viewState.pitch < FLAT_PITCH)}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('')}
        onClick={(e) => {
          // Tocar una zona sin lugares no cierra la ficha (RF-12.7).
          const id = placeIdFromFeatures(e.features)
          if (id) selectPlace(id, 'map')
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Logo y atribución juntos, abajo a la izquierda; la atribución va plegada en la «i». */}
        <AttributionControl position="bottom-left" compact />
        <RouteLayer />
        <FlyToRoute />
        <PlacesLayer />
        <UserLocationLayer />
        <FlyToSelection />
      </Map>
      <MapOverlay />
      <LocationNotice />
      <div className="absolute right-4 bottom-8 flex flex-col gap-2">
        <IconButton
          label={hasLocationAccess ? 'Mi ubicación' : 'Volver al campus'}
          onClick={onLocationButton}
          disabled={locating}
          aria-busy={locating}
        >
          {locating ? <LoaderCircle size={20} className="animate-spin" /> : <LocateFixed size={20} />}
        </IconButton>
        <RouteButton />
        <IconButton label={flat ? 'Vista 3D' : 'Vista 2D'} onClick={toggleView}>
          {flat ? <Box size={20} /> : <MapIcon size={20} />}
        </IconButton>
      </div>
      <RouteDialog />
    </div>
  )
}
