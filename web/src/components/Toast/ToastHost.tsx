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
    <div className="fixed right-4 bottom-20 left-4 z-[1100] flex flex-col gap-2 md:right-6 md:bottom-6 md:left-auto md:max-w-sm" role="status" aria-live="polite">
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
