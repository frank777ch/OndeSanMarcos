import { X } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { IconButton } from '@/components/IconButton/IconButton'
import { useAdminPlacesStore } from '../store/useAdminPlacesStore'

/** Aviso persistente cuando un lugar se guardó pero el asistente no se actualizó (RF-31.20). */
export function RagWarning() {
  const warning = useAdminPlacesStore((s) => s.ragWarning)
  const retry = useAdminPlacesStore((s) => s.retryReindex)
  const dismiss = useAdminPlacesStore((s) => s.dismissRagWarning)
  if (!warning) return null
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-md border border-danger px-4 py-3">
      <p className="m-0">
        El lugar «{warning.name}» se guardó, pero el asistente aún no lo conoce.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => void retry()}>
          Reintentar
        </Button>
        <IconButton label="Cerrar aviso" onClick={dismiss}>
          <X size={16} />
        </IconButton>
      </div>
    </div>
  )
}
