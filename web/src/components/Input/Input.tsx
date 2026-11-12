import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends ComponentProps<'input'> {
  label?: string
  error?: string
  /** Elemento dentro del campo, a la derecha (p. ej. un botón de mostrar/ocultar). */
  trailing?: ReactNode
}

export function Input({ label, error, trailing, id, className, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full rounded-md border border-border bg-bg px-4 py-3 placeholder:text-border-strong',
            trailing != null && 'pr-12',
            error && 'border-danger',
            className,
          )}
          {...rest}
        />
        {trailing != null && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
