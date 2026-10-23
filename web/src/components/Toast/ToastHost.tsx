import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { useToastStore } from './toastStore'
import styles from './Toast.module.css'

/** Muestra los avisos activos. Se monta una sola vez en el layout. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.kind]}`}>
          <span>{t.message}</span>
          <IconButton label="Cerrar aviso" onClick={() => dismiss(t.id)}>
            <X size={14} />
          </IconButton>
        </div>
      ))}
    </div>
  )
}
