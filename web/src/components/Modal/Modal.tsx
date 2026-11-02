import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { cn } from '@/lib/cn'
import { shouldCloseSheet } from './sheet'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Elemento que recibe el foco al abrir. Por defecto, el primer elemento enfocable del contenido. */
  initialFocus?: () => HTMLElement | null
  /**
   * En pantallas menores a `md` el panel sale desde arriba (como un bottom sheet invertido), a todo el
   * ancho, con un asa para arrastrarlo hacia arriba y cerrarlo. Desde `md` es el diálogo centrado de siempre.
   */
  mobileSheet?: boolean
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, title, onClose, children, initialFocus, mobileSheet }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const initialFocusRef = useRef(initialFocus)
  // Arrastre del asa: `dragY` es el desplazamiento (≤ 0) del panel; `dragging` desactiva la transición.
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)
  useEffect(() => {
    initialFocusRef.current = initialFocus
  })

  // Al abrir el foco entra al diálogo; al cerrar vuelve a donde estaba.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const dialog = dialogRef.current
    const target =
      initialFocusRef.current?.() ??
      dialog?.querySelector<HTMLElement>('[data-modal-body] :is(a[href], button, input, select, textarea)') ??
      dialog
    target?.focus()
    return () => {
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Atrapa el foco dentro del diálogo.
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onHandleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    // Sigue al dedo hacia arriba y no baja de su posición.
    setDragY(Math.min(0, e.clientY - startY.current))
  }
  const onHandleUp = () => {
    if (!dragging) return
    setDragging(false)
    if (shouldCloseSheet(dragY)) onClose()
    setDragY(0)
  }

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[1000] flex justify-center bg-overlay',
        mobileSheet ? 'items-start md:items-center' : 'items-center',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-sheet={mobileSheet ? 'top' : undefined}
        style={mobileSheet && dragY !== 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cn(
          'overflow-auto bg-bg shadow-lg',
          mobileSheet
            ? 'max-h-[85dvh] w-full rounded-b-2xl pt-[env(safe-area-inset-top)] motion-safe:animate-sheet-down md:max-h-[85vh] md:w-[min(32rem,90vw)] md:rounded-lg md:pt-0 md:animate-none'
            : 'max-h-[85vh] w-[min(32rem,90vw)] rounded-lg',
          mobileSheet && !dragging && 'transition-transform duration-200',
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-lg">
            {title}
          </h2>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div data-modal-body className="p-6">{children}</div>
        {mobileSheet && (
          // Asa para arrastrar hacia arriba y cerrar; solo en móvil.
          <div
            data-sheet-handle
            aria-hidden="true"
            className="flex h-6 cursor-grab touch-none items-center justify-center md:hidden"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          >
            <span className="h-1.5 w-10 rounded-full bg-border-strong" />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
