import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { useMapStore } from '@/features/map/store/useMapStore'
import type { LocationResult } from '../types'

/** Lugar nombrado por el asistente, con un botón que lleva al mapa. */
export function PlaceLinkCard({ place }: { place: LocationResult }) {
  const navigate = useNavigate()

  const openOnMap = () => {
    // El mapa se monta al entrar a /mapa y vuela solo hasta el lugar elegido.
    useMapStore.getState().selectPlace(place.id, 'other')
    navigate('/mapa')
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-bg p-3 shadow-sm">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface" aria-hidden="true">
        <MapPin size={22} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{place.name}</span>
        {place.schedule && (
          <span className="truncate text-sm text-muted" title={place.schedule}>
            {place.schedule}
          </span>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0"
        aria-label={`Ver en el mapa: ${place.name}`}
        onClick={openOnMap}
      >
        Ver en el mapa
      </Button>
    </div>
  )
}
