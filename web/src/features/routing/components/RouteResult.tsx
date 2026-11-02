import { LoaderCircle } from 'lucide-react'
import { useRouteStore } from '../store/useRouteStore'
import { formatDistance } from '../utils/distance'
import { pointLabel, type RouteError } from '../utils/planRoute'

const ERROR_MESSAGE: Record<RouteError, string> = {
  'same-place': 'El punto de partida y el destino son el mismo lugar',
  'origin-too-far': 'Estás muy lejos de los caminos del campus: el punto de partida no tiene un camino cerca',
  'destination-too-far': 'Estás muy lejos de los caminos del campus: el destino no tiene un camino cerca',
  'no-path': 'No encontramos un camino entre estos lugares',
}

/** Distancia de la ruta, o el aviso que corresponda. No muestra nada sin origen y destino. */
export function RouteResult() {
  const status = useRouteStore((s) => s.status)
  const result = useRouteStore((s) => s.result)
  const notice = useRouteStore((s) => s.notice)

  if (notice) {
    return (
      <p role="alert" className="mt-4 rounded-md bg-surface px-4 py-3 text-sm">
        {notice}
      </p>
    )
  }
  if (status === 'calculating' || status === 'locating') {
    return (
      <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted">
        <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
        {status === 'locating' ? 'Obteniendo tu ubicación…' : 'Calculando la ruta…'}
      </p>
    )
  }
  if (!result) return null
  if (!result.ok) {
    return (
      <p role="alert" className="mt-4 rounded-md bg-surface px-4 py-3 text-sm">
        {ERROR_MESSAGE[result.error]}
      </p>
    )
  }
  const { route } = result
  return (
    <div role="status" className="mt-4 rounded-md bg-primary-soft px-4 py-3">
      <p className="text-2xl font-bold">{formatDistance(route.distance)}</p>
      <p className="text-sm text-muted">
        {pointLabel(route.origin)} → {pointLabel(route.destination)}
      </p>
    </div>
  )
}
