import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { useToastStore } from './toastStore'
import { cn } from '@/lib/cn'
import type { ToastKind } from './toastStore'

const KIND_BORDER: Record<ToastKind, string> = {
  info: 'border-l-primary',
  success: 'border-l-success',
  error: 'border-l-danger',
}

/** Muestra los avisos activos. Se monta una sola vez en el layout. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed right-6 bottom-6 z-[1100] flex max-w-sm flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={cn(
            'flex items-center justify-between gap-3 rounded-md border-l-4 bg-bg px-4 py-3 shadow-md',
            KIND_BORDER[t.kind],
          )}>
          <span>{t.message}</span>
          <IconButton label="Cerrar aviso" onClick={() => dismiss(t.id)}>
            <X size={14} />
          </IconButton>
        </div>
      ))}
    </div>
  )
}
