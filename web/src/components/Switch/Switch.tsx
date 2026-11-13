import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Texto que acompaña al interruptor; también es su nombre accesible. */
  children: ReactNode
  disabled?: boolean
  className?: string
}

/**
 * Interruptor (toggle) para un valor sí/no. Es una casilla nativa con rol `switch`, oculta a la vista,
 * así que conserva el teclado (Espacio) y los lectores de pantalla; el control visible la sigue.
 */
export function Switch({ checked, onChange, children, disabled, className }: SwitchProps) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn('flex cursor-pointer items-center gap-3', disabled && 'cursor-not-allowed opacity-50', className)}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-checked:[&>span]:translate-x-5"
      >
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform" />
      </span>
      <span>{children}</span>
    </label>
  )
}
