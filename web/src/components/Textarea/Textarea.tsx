import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends ComponentProps<'textarea'> {
  label: string
  error?: string
  /** Ayuda corta debajo del campo. */
  hint?: string
}

export function Textarea({ label, error, hint, id, className, ...rest }: TextareaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
        {rest.required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'w-full resize-y rounded-md border border-border bg-bg px-4 py-3 placeholder:text-border-strong',
          error && 'border-danger',
          className,
        )}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="m-0 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
