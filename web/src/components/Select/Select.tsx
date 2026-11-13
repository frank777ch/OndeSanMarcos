import { useId, type ChangeEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

/**
 * Desplegable nativo con la flecha dibujada aparte, separada del borde (la del navegador queda pegada
 * a él y se ve asimétrica). Conserva el comportamiento y la accesibilidad del `<select>`.
 */
export function Select({ label, value, options, onChange, className }: SelectProps) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md border border-border bg-bg py-3 pr-11 pl-4"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  )
}
