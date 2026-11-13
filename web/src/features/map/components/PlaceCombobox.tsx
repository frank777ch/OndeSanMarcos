import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, Search, X } from 'lucide-react'
import { usePlacesStore } from '../store/usePlacesStore'
import type { Place } from '../types'
import { usePlaceSearch } from '../hooks/usePlaceSearch'
import { MIN_QUERY_LENGTH, normalizeText } from '../utils/search'
import { cn } from '@/lib/cn'

/** Opción fija que se ofrece con el campo vacío (por ejemplo «Mi ubicación»). */
export interface ExtraOption {
  id: string
  label: string
}

interface PlaceComboboxProps {
  /** Nombre accesible del campo; también es su texto de ayuda. */
  label: string
  /** Texto del campo (controlado). */
  value: string
  onValueChange: (text: string) => void
  onChoose: (place: Place) => void
  onClear: () => void
  clearLabel?: string
  /** Opciones fijas que aparecen al enfocar el campo vacío. */
  extraOptions?: ExtraOption[]
  onChooseExtra?: (id: string) => void
  inputRef?: Ref<HTMLInputElement>
  disabled?: boolean
  busy?: boolean
  /** Dibuja la lista fuera del contenedor, por encima de todo (dentro de un diálogo con scroll, que la recortaría). */
  portalList?: boolean
  className?: string
}

type Option = { key: string | number; place?: Place; extra?: ExtraOption }

/** Por encima del diálogo (z-[1000]) cuando la lista sale de su contenedor. */
const PORTAL_Z_INDEX = 1100

/** Campo de búsqueda de lugares con lista de resultados. No sabe nada del mapa. */
export function PlaceCombobox({
  label,
  value,
  onValueChange,
  onChoose,
  onClear,
  clearLabel = 'Limpiar búsqueda',
  extraOptions = [],
  onChooseExtra,
  inputRef,
  disabled,
  busy,
  portalList,
  className,
}: PlaceComboboxProps) {
  const baseId = useId()
  const listId = `${baseId}-list`
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<CSSProperties>({})

  const categories = usePlacesStore((s) => s.categories)
  const categoryLabel = useMemo(() => new Map(categories.map((c) => [c.id, c.label])), [categories])
  const { results, pending } = usePlaceSearch(value)
  const searching = normalizeText(value).length >= MIN_QUERY_LENGTH
  const empty = value.trim() === ''
  const options: Option[] = empty
    ? extraOptions.map((extra) => ({ key: extra.id, extra }))
    : results.map((place) => ({ key: place.id, place }))
  const showList = open && options.length > 0
  // Mientras el servidor aún responde no se anuncia «sin resultados»: puede traer coincidencias aproximadas.
  const showEmpty = open && searching && results.length === 0 && !pending
  const listVisible = showList || showEmpty
  const optionId = (i: number) => `${baseId}-opt-${i}`

  // En modo portal la lista se coloca (position: fixed) justo debajo del campo y lo sigue.
  useEffect(() => {
    if (!portalList || !listVisible) return
    const place = () => {
      const r = wrapperRef.current?.getBoundingClientRect()
      if (r) {
        setAnchor({ position: 'fixed', zIndex: PORTAL_Z_INDEX, top: r.bottom + 4, left: r.left, width: r.width })
      }
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [portalList, listVisible])

  const withPortal = (node: ReactElement) => (portalList ? createPortal(node, document.body) : node)

  const closeList = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const choose = (option: Option) => {
    if (option.place) onChoose(option.place)
    else if (option.extra) onChooseExtra?.(option.extra.id)
    closeList()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!options.length) return
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (showList && activeIndex >= 0) {
        e.preventDefault()
        choose(options[activeIndex])
      }
    } else if (e.key === 'Escape') {
      // Con la lista visible, Esc solo la cierra; si no, llega a quien esté debajo (ficha o diálogo).
      if (showList || showEmpty) e.stopPropagation()
      closeList()
    }
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-[min(26rem,100%)]', className)}>
      <div className="relative flex items-center">
        {busy ? (
          <LoaderCircle size={18} aria-hidden="true" className="pointer-events-none absolute left-3 animate-spin text-muted" />
        ) : (
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 text-muted" />
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          placeholder={label}
          autoComplete="off"
          disabled={disabled}
          className="w-full rounded-full border border-border bg-bg px-10 py-3 shadow-md focus-visible:outline-none disabled:opacity-60"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {value && !disabled && (
          <button
            type="button"
            aria-label={clearLabel}
            className="absolute right-2 inline-flex size-7 items-center justify-center rounded-full bg-transparent p-0 text-muted hover:bg-surface"
            onClick={() => {
              closeList()
              onClear()
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {withPortal(
        // El contenedor recorta las esquinas redondeadas; la barra de scroll vive dentro de él.
        <div
          hidden={!showList}
          className={cn(
            'z-10 mt-1 overflow-hidden rounded-md border border-border bg-bg shadow-md',
            !portalList && 'absolute top-full right-0 left-0',
          )}
          style={portalList ? anchor : undefined}
          // Evita que el campo pierda el foco (y cierre la lista) antes del clic.
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Máximo 5 opciones visibles (≈ 3,5 rem cada una); el resto con scroll. */}
          <ul
            id={listId}
            role="listbox"
            aria-label="Resultados de la búsqueda"
            className="max-h-[18.25rem] overflow-y-auto p-1 [scrollbar-width:thin]"
          >
            {showList &&
              options.map((option, i) => (
                <li
                  key={option.key}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={cn(
                    'flex cursor-pointer flex-col rounded-sm px-3 py-2',
                    i === activeIndex && 'bg-primary-soft',
                  )}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span className="font-medium">{option.place?.name ?? option.extra?.label}</span>
                  {option.place && <span className="text-xs text-muted">{categoryLabel.get(option.place.category)}</span>}
                </li>
              ))}
          </ul>
        </div>,
      )}

      {showEmpty &&
        withPortal(
          <p
            role="status"
            className={cn(
              'z-10 mt-1 rounded-md border border-border bg-bg px-4 py-3 text-muted shadow-md',
              !portalList && 'absolute top-full right-0 left-0',
            )}
            style={portalList ? anchor : undefined}
          >
            No encontramos ese lugar
          </p>,
        )}
    </div>
  )
}
