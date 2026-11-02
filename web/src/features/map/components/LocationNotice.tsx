import { useEffect, useId } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { useLocationStore } from '../store/useLocationStore'

/**
 * Aviso antes de pedir el permiso de ubicación. No es modal: el mapa, la
 * búsqueda y el chat siguen usables mientras está abierto.
 */
export function LocationNotice() {
  const open = useLocationStore((s) => s.noticeOpen)
  const allow = useLocationStore((s) => s.allow)
  const dismiss = useLocationStore((s) => s.dismissNotice)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  if (!open) return null

  return (
    <aside
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="absolute bottom-10 left-1/2 z-20 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-border bg-bg px-5 py-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <MapPin size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id={titleId} className="text-base">
            ¿Mostrar dónde estás?
          </h2>
          <p id={descId} className="mt-1 text-sm text-muted">
            Usamos tu ubicación solo para mostrarte dónde estás en el mapa cuando pulses el botón de
            ubicación. No se guarda ni se envía a ningún servidor.
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Ahora no
        </Button>
        <Button size="sm" onClick={() => void allow()}>
          Permitir
        </Button>
      </div>
    </aside>
  )
}
