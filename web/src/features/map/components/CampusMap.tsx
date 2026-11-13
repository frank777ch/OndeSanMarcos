import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { AttributionControl, type MapRef } from 'react-map-gl/mapbox'
import { Box, LoaderCircle, LocateFixed, Map as MapIcon, Route } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Config } from '@/config'
import { useToastStore } from '@/components/Toast/toastStore'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '../constants/campus'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { FlyToRoute } from '@/features/routing/components/FlyToRoute'
import { RouteLayer, ROUTE_HIT_LAYER } from '@/features/routing/components/RouteLayer'
import { RouteRemoveButton } from '@/features/routing/components/RouteRemoveButton'
import { RouteDialog } from '@/features/routing/components/RouteDialog'
import { useLocationStore } from '../store/useLocationStore'
import { useMapStore } from '../store/useMapStore'
import { placeIdFromFeatures } from '../utils/places'
import { expandBounds } from '../utils/userLocation'
import { FlyToSelection } from './FlyToSelection'
import { LocationNotice } from './LocationNotice'
import { MapActions } from './MapActions'
import { MapOverlay } from './MapOverlay'
import { PlacesLayer } from './PlacesLayer'
import { UserLocationLayer } from './UserLocationLayer'

const MAP_STYLE = 'mapbox://styles/mapbox/standard'
const LOCATION_ZOOM = 18
/** Por debajo de esta inclinación (grados) la vista se considera plana (2D). */
const FLAT_PITCH = 1

const onRoute = (features?: { layer?: { id: string } }[]) => !!features?.some((f) => f.layer?.id === ROUTE_HIT_LAYER)

export function CampusMap() {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const [cursor, setCursor] = useState('')
  const [flat, setFlat] = useState(false)
  const permission = useLocationStore((s) => s.permission)
  const position = useLocationStore((s) => s.position)
  const locating = useLocationStore((s) => s.locating)
  // «Volver al campus» solo cuando no hay forma de ubicar al usuario; con el permiso pendiente, pedirlo.
  const hasLocationAccess = permission !== 'denied' && permission !== 'unsupported'

  // Al venir de otra página, <main> aún se está ensanchando (transición de `left`) cuando el mapa mide su
  // lienzo; sin esto queda una franja vacía a un lado. Solo el contenedor cambia de tamaño, no la barra.
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => mapRef.current?.resize())
    observer.observe(el)
    return () => observer.disconnect()
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
        interactiveLayerIds={[ROUTE_HIT_LAYER, 'places-circles']}
        cursor={cursor}
        // La etiqueta del botón sigue a la inclinación real, también si el usuario la cambia con el mouse.
        onPitchEnd={(e) => setFlat(e.viewState.pitch < FLAT_PITCH)}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('')}
        onMouseMove={(e) => {
          const { activeRoute, setRouteHover, scheduleHide } = useRouteStore.getState()
          if (activeRoute && onRoute(e.features)) {
            // La «X» se queda donde apareció (para poder llegar a ella); solo se reubica si el cursor ya se alejó mucho.
            const { routeHover, cancelHide } = useRouteStore.getState()
            const shown = routeHover && mapRef.current?.project(routeHover)
            if (shown && Math.hypot(shown.x - e.point.x, shown.y - e.point.y) < 90) cancelHide()
            else setRouteHover([e.lngLat.lng, e.lngLat.lat])
          } else scheduleHide()
        }}
        onClick={(e) => {
          const { activeRoute, setRouteHover, scheduleHide } = useRouteStore.getState()
          // La ruta tiene prioridad sobre los lugares. En táctil, el toque fija la «X» unos segundos.
          if (activeRoute && onRoute(e.features)) {
            setRouteHover([e.lngLat.lng, e.lngLat.lat])
            scheduleHide(4000)
            return
          }
          setRouteHover(null)
          // Tocar una zona sin lugares no cierra la ficha (RF-12.7).
          const id = placeIdFromFeatures(e.features)
          if (id !== null) selectPlace(id, 'map')
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Logo y atribución juntos, abajo a la izquierda; la atribución va plegada en la «i». */}
        <AttributionControl position="bottom-left" compact />
        <RouteLayer />
        <RouteRemoveButton />
        <FlyToRoute />
        <PlacesLayer />
        <UserLocationLayer />
        <FlyToSelection />
      </Map>
      <MapOverlay />
      <LocationNotice />
      <MapActions
        actions={[
          {
            label: hasLocationAccess ? 'Mi ubicación' : 'Volver al campus',
            icon: locating ? <LoaderCircle size={20} className="animate-spin" /> : <LocateFixed size={20} />,
            onClick: onLocationButton,
            disabled: locating,
            busy: locating,
          },
          {
            label: 'Planificar ruta',
            icon: <Route size={20} />,
            onClick: () => useRouteStore.getState().openDialog(),
          },
          { label: flat ? 'Vista 3D' : 'Vista 2D', icon: flat ? <Box size={20} /> : <MapIcon size={20} />, onClick: toggleView },
        ]}
      />
      <RouteDialog />
    </div>
  )
}
