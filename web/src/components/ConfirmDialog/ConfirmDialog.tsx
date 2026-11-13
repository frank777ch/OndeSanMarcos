import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Pide confirmar una acción que afecta a los visitantes (despublicar, borrar una categoría). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} blurBackdrop>
      <p className="m-0 text-base">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
