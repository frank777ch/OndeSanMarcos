import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  /** Texto accesible (obligatorio: el botón no tiene texto visible). */
  label: string
  children: ReactNode
}

export function IconButton({
  label,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      // shrink-0: no se ovala dentro de filas flex junto a títulos largos.
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg p-0 text-ink shadow-sm transition-colors enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
