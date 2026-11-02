import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { AttributionControl, type MapRef } from 'react-map-gl/mapbox'
import { LoaderCircle, LocateFixed } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Config } from '@/config'
import { IconButton } from '@/components/IconButton/IconButton'
import { useToastStore } from '@/components/Toast/toastStore'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '../constants/campus'
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
/** Espera sin cambios de tamaño antes de redimensionar el mapa. */
const RESIZE_SETTLE_MS = 120

export function CampusMap() {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const [cursor, setCursor] = useState('')
  const permission = useLocationStore((s) => s.permission)
  const position = useLocationStore((s) => s.position)
  const locating = useLocationStore((s) => s.locating)
  const hasLocationAccess = permission === 'granted'

  // Mapbox solo escucha el resize de la ventana: si cambia el ancho del contenedor
  // (p. ej. al contraer la barra lateral) hay que avisarle. Se hace una sola vez, cuando
  // el tamaño deja de cambiar: cada resize() borra el lienzo y, hecho en cada fotograma
  // de la animación, el mapa parpadearía en blanco.
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let lastWidth = el.clientWidth
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const map = mapRef.current?.getMap()
        if (!map) return
        const before = lastWidth
        const after = el.clientWidth
        lastWidth = after
        map.resize()
        // resize() deja el centro del mapa en el centro del lienzo nuevo, y el contenido
        // da un salto de (after - before) / 2 píxeles. Se desplaza el centro para que
        // lo que se veía a la izquierda no se mueva.
        if (after !== before) {
          map.jumpTo({ center: map.unproject([after - before / 2, el.clientHeight / 2]) })
        }
      }, RESIZE_SETTLE_MS)
    })
    observer.observe(el)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

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
    <div ref={containerRef} className="relative size-full">
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
      </div>
    </div>
  )
}
