import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { normalizeText } from '@/features/map/utils/search'

export interface ComboboxOption {
  value: string
  label: string
  /** Texto secundario (por ejemplo el id), también se busca. */
  hint?: string
}

interface ComboboxProps {
  label: string
  options: ComboboxOption[]
  /** Valor elegido, o `null` si no hay ninguno. */
  value: string | null
  onChange: (value: string | null) => void
  /** Marca el campo como obligatorio (solo visual: la validación la hace quien lo usa). */
  required?: boolean
  /** Permite quitar la elección con un botón (campos opcionales y filtros). */
  clearable?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
  /** Oculta la etiqueta visible (el campo sigue teniendo nombre accesible). */
  hideLabel?: boolean
  /** Identificador del campo (para llevarle el foco desde fuera). */
  id?: string
  className?: string
}

/** Por encima de los diálogos (z-[1000]): la lista sale del contenedor para no quedar recortada. */
const PORTAL_Z_INDEX = 1100

/**
 * Selector con búsqueda que solo admite valores de la lista (HU-31, RF-31.14): lo que se escribe
 * filtra las opciones, pero no es un valor; si se sale sin elegir, el texto se descarta.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  required,
  clearable,
  error,
  disabled,
  placeholder,
  hideLabel,
  id,
  className,
}: ComboboxProps) {
  const generatedId = useId()
  const baseId = id ?? generatedId
  const listId = `${baseId}-list`
  const errorId = `${baseId}-error`
  const optionId = (i: number) => `${baseId}-opt-${i}`
  const wrapperRef = useRef<HTMLDivElement>(null)
  // `query` es null mientras no se escribe: el campo muestra la opción elegida.
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [notChosen, setNotChosen] = useState(false)
  const [anchor, setAnchor] = useState<CSSProperties>({})

  const selected = options.find((o) => o.value === value) ?? null
  const shown = query ?? selected?.label ?? ''

  const filtered = useMemo(() => {
    const needle = normalizeText(query ?? '')
    if (!needle) return options
    return options.filter((o) => normalizeText(`${o.label} ${o.hint ?? ''}`).includes(needle))
  }, [options, query])

  const listVisible = open && !disabled

  useEffect(() => {
    if (!listVisible) return
    const place = () => {
      const r = wrapperRef.current?.getBoundingClientRect()
      if (r) setAnchor({ position: 'fixed', zIndex: PORTAL_Z_INDEX, top: r.bottom + 4, left: r.left, width: r.width })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [listVisible])

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const choose = (option: ComboboxOption) => {
    onChange(option.value)
    setQuery(null)
    setNotChosen(false)
    close()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // Enter nunca envía el formulario desde este campo: elige o no hace nada.
      e.preventDefault()
      if (listVisible && filtered.length > 0) choose(filtered[activeIndex >= 0 ? activeIndex : 0])
    } else if (e.key === 'Escape') {
      // Con la lista abierta, Esc solo la cierra; si no, llega al diálogo.
      if (listVisible) e.stopPropagation()
      setQuery(null)
      close()
    }
  }

  return (
    <div ref={wrapperRef} className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={baseId} className={cn('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={baseId}
          type="text"
          role="combobox"
          aria-expanded={listVisible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required={required || undefined}
          aria-invalid={error || notChosen ? true : undefined}
          aria-describedby={error || notChosen ? errorId : undefined}
          aria-activedescendant={listVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder ?? 'Buscar…'}
          value={shown}
          className={cn(
            'w-full rounded-md border border-border bg-bg py-3 pr-16 pl-4 placeholder:text-border-strong disabled:opacity-60',
            (error || notChosen) && 'border-danger',
          )}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(0)
            setNotChosen(false)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Lo escrito sin elegir no es un valor: se descarta y se avisa.
            if (query !== null && query.trim() !== '') setNotChosen(true)
            setQuery(null)
            close()
          }}
          onKeyDown={onKeyDown}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1 text-muted">
          {clearable && selected && !disabled && (
            <button
              type="button"
              aria-label={`Quitar ${label}`}
              className="inline-flex size-7 items-center justify-center rounded-full bg-transparent p-0 hover:bg-surface"
              onClick={() => {
                onChange(null)
                setQuery(null)
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
          <ChevronDown size={18} aria-hidden="true" className="pointer-events-none" />
        </div>
      </div>
      {listVisible &&
        createPortal(
          <div
            className="overflow-hidden rounded-md border border-border bg-bg shadow-md"
            style={anchor}
            // Evita que el campo pierda el foco (y cierre la lista) antes del clic.
            onMouseDown={(e) => e.preventDefault()}
          >
            <ul id={listId} role="listbox" aria-label={label} className="m-0 max-h-60 list-none overflow-y-auto p-0">
              {filtered.length === 0 ? (
                <li role="presentation" className="px-4 py-3 text-sm text-muted">
                  Sin resultados
                </li>
              ) : (
                filtered.map((option, i) => (
                  <li
                    key={option.value}
                    id={optionId(i)}
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      'cursor-pointer px-4 py-2',
                      i === activeIndex && 'bg-surface-strong',
                      option.value === value && 'font-medium',
                    )}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(option)}
                  >
                    {option.label}
                    {option.hint && <span className="ml-2 text-sm text-muted">{option.hint}</span>}
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
      {(error || notChosen) && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error ?? 'Elige una opción de la lista.'}
        </p>
      )}
    </div>
  )
}
