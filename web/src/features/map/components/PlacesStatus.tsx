import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { PLACES_ERROR_MESSAGE, usePlacesStore } from '../store/usePlacesStore'

/**
 * Aviso del estado de los lugares sobre el mapa: «Cargando…» mientras llegan y,
 * si fallan, un mensaje con «Reintentar». Con los lugares listos no muestra nada.
 * El mapa base y la ubicación del usuario siguen funcionando mientras tanto.
 */
export function PlacesStatus() {
  const status = usePlacesStore((s) => s.status)
  const load = usePlacesStore((s) => s.load)

  if (status === 'loading' || status === 'idle') {
    return (
      <div role="status" className="flex items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2 text-sm text-muted shadow-sm">
        <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Cargando lugares del campus…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert" className="flex w-[min(26rem,100%)] items-start gap-3 rounded-lg border border-border bg-bg px-4 py-3 text-sm shadow-sm">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <div className="flex flex-1 flex-col items-start gap-2">
          <p>{PLACES_ERROR_MESSAGE}</p>
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return null
}
