import { useEffect, useRef } from 'react'
import { frameListeners, useCameraStore } from '../scene/cameraStore'
import { useMapColors } from '../scene/useMapColors'
import { useVisiblePlaces } from '../scene/useVisiblePlaces'

/** Distancia vertical (px) entre el punto y su nombre. */
const LABEL_OFFSET_PX = 14

/**
 * Nombres de los lugares como texto del documento (con el tipo de letra de la app), colocados sobre
 * el lienzo tras cada cuadro. Solo se muestran con la cámara cerca; lejos quedan solo los puntos.
 */
export function PlaceLabels() {
  const places = useVisiblePlaces()
  const colors = useMapColors()
  const api = useCameraStore((s) => s.api)
  const close = useCameraStore((s) => s.labels)
  const refs = useRef(new Map<number, HTMLDivElement>())

  useEffect(() => {
    if (!api) return
    const place = () => {
      for (const p of places) {
        const el = refs.current.get(p.id)
        if (!el) continue
        const { x, y, visible } = api.project(p.position)
        // `inherit` y no `visible`: así respeta el `invisible` del contenedor cuando la pestaña del mapa no está activa.
        el.style.visibility = visible ? 'inherit' : 'hidden'
        el.style.transform = `translate3d(${x}px, ${y + LABEL_OFFSET_PX}px, 0) translateX(-50%)`
      }
    }
    place()
    frameListeners.add(place)
    return () => void frameListeners.delete(place)
  }, [api, places, close])

  if (!close) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {places.map((p) => (
        <div
          key={p.id}
          ref={(el) => {
            if (el) refs.current.set(p.id, el)
            else refs.current.delete(p.id)
          }}
          className="absolute top-0 left-0 w-[9em] text-center text-xs leading-tight"
          style={{
            visibility: 'hidden',
            color: colors.label,
            textShadow: `0 0 3px ${colors.labelHalo}, 0 0 3px ${colors.labelHalo}, 0 0 2px ${colors.labelHalo}`,
          }}
        >
          {p.name}
        </div>
      ))}
    </div>
  )
}
