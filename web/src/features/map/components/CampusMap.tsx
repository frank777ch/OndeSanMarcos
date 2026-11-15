import { useEffect, useRef } from 'react'
import { Box, LoaderCircle, LocateFixed, Map as MapIcon, Moon, Route, Spline, Sun } from 'lucide-react'
import { useToastStore } from '@/components/Toast/toastStore'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { useWalkwaysDebug } from '@/features/routing/debug/useWalkwaysDebug'
import { WalkwaysLegend } from '@/features/routing/debug/WalkwaysLegend'
import { FlyToRoute } from '@/features/routing/components/FlyToRoute'
import { RouteDialog } from '@/features/routing/components/RouteDialog'
import { useThemeStore } from '@/features/theme/useThemeStore'
import { useLocationStore } from '../store/useLocationStore'
import { CampusScene } from '../scene/CampusScene'
import { useCameraStore } from '../scene/cameraStore'
import { viewPadding } from '../utils/viewPadding'
import { CampusPointer } from './CampusPointer'
import { FlyToSelection } from './FlyToSelection'
import { LocationNotice } from './LocationNotice'
import { MapActions } from './MapActions'
import { MapOverlay } from './MapOverlay'
import { PlaceLabels } from './PlaceLabels'

/** Zoom (estilo Mapbox) al que se acerca la cámara a la ubicación del usuario. */
const LOCATION_ZOOM = 18

export function CampusMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const flat = useCameraStore((s) => s.flat)
  const dark = useThemeStore((s) => s.theme === 'dark')
  const permission = useLocationStore((s) => s.permission)
  const position = useLocationStore((s) => s.position)
  const locating = useLocationStore((s) => s.locating)
  // «Volver al campus» solo cuando no hay forma de ubicar al usuario; con el permiso pendiente, pedirlo.
  const hasLocationAccess = permission !== 'denied' && permission !== 'unsupported'

  // Consulta el permiso al entrar al mapa; no mueve la cámara (RF-15.10).
  useEffect(() => useLocationStore.getState().init(), [])

  // Los límites de la cámara se amplían si la posición del usuario cae fuera del campus (RF-15.16, RF-40.6).
  useEffect(() => {
    useCameraStore.getState().setExtra(position?.coordinates ?? null)
  }, [position])

  const toggleView = () => useCameraStore.getState().setFlat(!flat)

  const backToCampus = (duration?: number) => useCameraStore.getState().resetToCampus(viewPadding(containerRef.current), duration)

  // La vista inicial deja el campus entero en el área que no tapan la barra lateral ni el buscador.
  const sceneReady = useCameraStore((s) => s.api !== null)
  useEffect(() => {
    if (sceneReady) backToCampus(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady])

  const goToMyLocation = async () => {
    const result = await useLocationStore.getState().locate()
    if (result) {
      // Se amplían los límites antes de volar, sin esperar al siguiente render.
      useCameraStore.getState().setExtra(result.coordinates)
      useCameraStore.getState().flyTo(result.coordinates, { zoom: LOCATION_ZOOM })
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

  return (
    <div ref={containerRef} className="relative size-full">
      {/* `isolate`: los z-index internos de la escena (nombres, «X») no pasan por encima del buscador ni de las fichas. */}
      <div className="absolute inset-0 isolate">
        <CampusScene />
        <PlaceLabels />
        <CampusPointer container={containerRef} />
      </div>
      <FlyToSelection />
      <FlyToRoute container={containerRef} />
      <MapOverlay />
      <LocationNotice />
      {/* Atribución obligatoria de los datos (ODbL), con el enlace que pide OpenStreetMap. */}
      <p className="absolute bottom-1 left-2 text-[11px] text-muted md:left-[calc(var(--sidebar-w)+0.5rem)]">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          <span className="md:hidden">© OpenStreetMap</span>
          <span className="hidden md:inline">Datos del mapa © colaboradores de OpenStreetMap</span>
        </a>
      </p>
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
          {
            label: dark ? 'Tema claro' : 'Tema oscuro',
            icon: dark ? <Sun size={20} /> : <Moon size={20} />,
            onClick: (event) => {
              // El círculo del cambio de tema nace en el centro del botón.
              const box = event.currentTarget.getBoundingClientRect()
              useThemeStore.getState().toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
            },
          },
          // TEMPORAL: ver los caminos de OSM sobre el mapa.
          { label: 'Caminos OSM (temporal)', icon: <Spline size={20} />, onClick: () => useWalkwaysDebug.getState().toggle() },
        ]}
      />
      <WalkwaysLegend />
      <RouteDialog />
    </div>
  )
}
