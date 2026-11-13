import { BadgeCheck, BadgeX, Eye, EyeOff, Pencil } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import type { AdminPlace } from '../types'

interface PlaceRowActionsProps {
  place: AdminPlace
  busy: boolean
  onEdit: (place: AdminPlace) => void
  onTogglePublished: (place: AdminPlace) => void
  onToggleVerified: (place: AdminPlace) => void
}

/** Acciones de una fila; cada botón nombra el lugar para los lectores de pantalla (RF-31.35). */
export function PlaceRowActions({ place, busy, onEdit, onTogglePublished, onToggleVerified }: PlaceRowActionsProps) {
  const verified = place.verifiedAt !== null
  return (
    <div className="flex justify-end gap-2">
      <IconButton label={`Editar ${place.name}`} disabled={busy} onClick={() => onEdit(place)}>
        <Pencil size={16} />
      </IconButton>
      <IconButton
        label={`${place.isPublished ? 'Despublicar' : 'Publicar'} ${place.name}`}
        disabled={busy}
        aria-busy={busy}
        onClick={() => onTogglePublished(place)}
      >
        {place.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
      </IconButton>
      <IconButton
        label={`${verified ? 'Quitar verificación de' : 'Marcar como verificado'} ${place.name}`}
        disabled={busy}
        aria-busy={busy}
        onClick={() => onToggleVerified(place)}
      >
        {verified ? <BadgeX size={16} /> : <BadgeCheck size={16} />}
      </IconButton>
    </div>
  )
}
