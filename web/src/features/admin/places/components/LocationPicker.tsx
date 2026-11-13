import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { AttributionControl, Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Config } from '@/config'
import { CAMPUS, CAMPUS_MAX_BOUNDS } from '@/features/map/constants/campus'
import { inPlaceArea } from '../utils/bounds'

const MAP_STYLE = 'mapbox://styles/mapbox/standard'
const PICK_ZOOM = 18
const OUT_OF_AREA = 'Ese punto está fuera del área del campus'

export interface ContextPlace {
  id: string
  lat: number
  lng: number
}

interface LocationPickerProps {
  /** Coordenadas actuales del formulario (ya convertidas), o `null` si aún no hay una ubicación válida. */
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number) => void
  /** Los demás lugares, como puntos grises de referencia (RF-31.26). */
  contextPlaces: ContextPlace[]
  /** El lugar que se edita: no se repite como punto gris. */
  editingId?: string | null
}

/**
 * Mapa plano (2D) para elegir la ubicación de un lugar haciendo clic o arrastrando el marcador
 * (RF-31.21 a RF-31.27). Solo acepta puntos dentro del área permitida por el servidor.
 */
export function LocationPicker({ lat, lng, onPick, contextPlaces, editingId }: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // Se remonta el marcador al soltarlo fuera del área para que vuelva a su sitio.
  const [markerKey, setMarkerKey] = useState(0)
  // Último punto elegido en el mapa: al escribirlo el formulario no hay que volver a centrar.
  const picked = useRef<[number, number] | null>(null)
  const hasPoint = lat !== null && lng !== null

  const context = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: contextPlaces
        .filter((p) => p.id !== editingId)
        .map((p) => ({
          type: 'Feature' as const,
          properties: { id: p.id },
          geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        })),
    }),
    [contextPlaces, editingId],
  )

  // Al escribir coordenadas válidas el mapa se centra en el marcador (RF-31.23).
  useEffect(() => {
    if (lat === null || lng === null) return
    if (picked.current?.[0] === lat && picked.current[1] === lng) return
    mapRef.current?.easeTo({ center: [lng, lat], zoom: PICK_ZOOM, duration: 400 })
  }, [lat, lng])

  const accept = (pickedLat: number, pickedLng: number): boolean => {
    if (!inPlaceArea(pickedLat, pickedLng)) {
      setWarning(OUT_OF_AREA)
      return false
    }
    setWarning(null)
    picked.current = [pickedLat, pickedLng]
    onPick(pickedLat, pickedLng)
    return true
  }

  if (!Config.mapbox.hasToken || failed) {
    return (
      <p role="status" className="m-0 rounded-md border border-border bg-surface p-4 text-sm text-muted">
        {failed
          ? 'No se pudo cargar el mapa. Escribe la latitud y la longitud en los campos de abajo.'
          : 'El mapa no está disponible (falta el token de Mapbox). Escribe la latitud y la longitud en los campos de abajo.'}
      </p>
    )
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-md border border-border">
      <Map
        ref={mapRef}
        mapboxAccessToken={Config.mapbox.token}
        mapStyle={MAP_STYLE}
        initialViewState={
          hasPoint
            ? { longitude: lng, latitude: lat, zoom: PICK_ZOOM, pitch: 0, bearing: 0 }
            : {
                bounds: [CAMPUS.bounds.sw, CAMPUS.bounds.ne],
                fitBoundsOptions: { padding: 24 },
                pitch: 0,
                bearing: 0,
              }
        }
        // Vista plana: sin inclinación ni rotación, con ningún gesto que las cambie (RF-31.21).
        maxPitch={0}
        minPitch={0}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        maxBounds={CAMPUS_MAX_BOUNDS}
        minZoom={CAMPUS.minZoom}
        maxZoom={CAMPUS.maxZoom}
        cursor="crosshair"
        logoPosition="bottom-left"
        attributionControl={false}
        onClick={(e) => void accept(e.lngLat.lat, e.lngLat.lng)}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%' }}
      >
        <AttributionControl position="bottom-left" compact />
        <Source id="context-places" type="geojson" data={context}>
          <Layer
            id="context-places-circles"
            type="circle"
            slot="top"
            paint={{
              'circle-radius': 4,
              'circle-color': '#9e9e9e',
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </Source>
        {hasPoint && (
          <Marker
            key={markerKey}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            draggable
            onDragEnd={(e) => {
              if (!accept(e.lngLat.lat, e.lngLat.lng)) setMarkerKey((k) => k + 1)
            }}
          >
            <MapPin size={32} aria-hidden="true" className="fill-primary text-on-primary drop-shadow" />
          </Marker>
        )}
      </Map>
      {warning && (
        <p
          role="alert"
          className="absolute top-2 left-1/2 m-0 -translate-x-1/2 rounded-md bg-danger px-3 py-1 text-sm text-white shadow-md"
        >
          {warning}
        </p>
      )}
    </div>
  )
}
