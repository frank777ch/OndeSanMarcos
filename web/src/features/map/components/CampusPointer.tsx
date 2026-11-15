import { useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { campusRings, insideCampus } from '../scene/cameraMath'
import { frameListeners, useCameraStore } from '../scene/cameraStore'
import { viewPadding } from '../utils/viewPadding'
import type { RefObject } from 'react'

/** Indicador de borde (a 360°): cuando el campus no se ve, una flecha en el borde del mapa señala hacia dónde está. */
export function CampusPointer({ container }: { container: RefObject<HTMLElement | null> }) {
  const api = useCameraStore((s) => s.api)
  const button = useRef<HTMLButtonElement>(null)
  const arrow = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!api) return
    const update = () => {
      const el = button.current
      const chevron = arrow.current
      if (!el || !chevron) return
      const { width, height } = api.size()
      // En foco: el centro de la vista cae dentro del campus o se ve algún punto de su contorno.
      const target = api.pose().target
      const inFocus =
        insideCampus(target) || campusRings().some((ring) => ring.some(([x, z]) => api.project([x, 0, z]).visible))
      if (inFocus || width === 0) {
        el.style.display = 'none'
        return
      }
      // Dirección desde el centro del área libre hacia el centro del campus (invertida si queda detrás de la cámara).
      const pad = viewPadding(container.current)
      const cx = (pad.left + (width - pad.right)) / 2
      const cy = (pad.top + (height - pad.bottom)) / 2
      const ring = campusRings()[0]
      const mx = ring.reduce((a, p) => a + p[0], 0) / ring.length
      const mz = ring.reduce((a, p) => a + p[1], 0) / ring.length
      const raw = api.project([mx, 0, mz])
      // Si queda detrás de la cámara, la proyección sale invertida: se da la vuelta a la dirección.
      const sign = raw.behind ? -1 : 1
      const dx = (raw.x - cx) * sign
      const dy = (raw.y - cy) * sign
      const angle = Math.atan2(dy, dx)
      // Intersección del rayo con el rectángulo del área libre.
      const halfW = (width - pad.left - pad.right) / 2
      const halfH = (height - pad.top - pad.bottom) / 2
      const t = Math.min(halfW / Math.abs(Math.cos(angle) || 1e-6), halfH / Math.abs(Math.sin(angle) || 1e-6))
      el.style.display = 'flex'
      el.style.transform = `translate(${cx + Math.cos(angle) * t}px, ${cy + Math.sin(angle) * t}px) translate(-50%, -50%)`
      chevron.style.transform = `rotate(${angle}rad)`
    }
    update()
    frameListeners.add(update)
    return () => void frameListeners.delete(update)
  }, [api, container])

  return (
    <button
      ref={button}
      type="button"
      aria-label="Ir al campus"
      title="Ir al campus"
      style={{ display: 'none' }}
      onClick={() => useCameraStore.getState().resetToCampus(viewPadding(container.current))}
      className="absolute top-0 left-0 size-10 items-center justify-center rounded-full border border-border bg-bg text-primary shadow-md hover:bg-surface"
    >
      <span ref={arrow} className="flex">
        <ChevronRight size={24} strokeWidth={2.75} aria-hidden="true" />
      </span>
    </button>
  )
}
