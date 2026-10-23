import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[85vh] w-[min(32rem,90vw)] overflow-auto rounded-lg bg-bg shadow-lg"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-lg">
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
