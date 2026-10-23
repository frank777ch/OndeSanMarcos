import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Search, X } from 'lucide-react'
import { PLACE_CATEGORIES, PLACES, type Place } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import { MIN_QUERY_LENGTH, normalizeText, searchPlaces } from '../utils/search'
import { cn } from '@/lib/cn'

const CATEGORY_LABEL = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<string, string>

export function PlaceSearch() {
  const baseId = useId()
  const listId = `${baseId}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const clearSelection = useMapStore((s) => s.clearSelection)
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // El campo sigue a la selección: muestra el nombre del lugar elegido (también
  // al tocar un punto del mapa) y se vacía cuando la ficha se cierra.
  const [syncedId, setSyncedId] = useState(selectedPlaceId)
  if (syncedId !== selectedPlaceId) {
    setSyncedId(selectedPlaceId)
    setQuery(PLACES.find((p) => p.id === selectedPlaceId)?.name ?? '')
    setOpen(false)
    setActiveIndex(-1)
  }

  const results = useMemo(() => searchPlaces(PLACES, query), [query])
  const searching = normalizeText(query).length >= MIN_QUERY_LENGTH
  const showList = open && searching && results.length > 0
  const showEmpty = open && searching && results.length === 0
  const optionId = (i: number) => `${baseId}-opt-${i}`

  const choose = (place: Place) => {
    selectPlace(place.id)
    setQuery(place.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  const clear = () => {
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
    clearSelection()
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!results.length) return
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (showList && activeIndex >= 0) {
        e.preventDefault()
        choose(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      // Con la lista visible, Esc solo la cierra; si no, llega a la ficha.
      if (open && searching) e.stopPropagation()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative w-[min(26rem,100%)]">
      <div className="relative flex items-center">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 text-muted" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Buscar un lugar"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          placeholder="Buscar un lugar"
          autoComplete="off"
          className="w-full rounded-full border border-border bg-bg px-10 py-3 shadow-md focus-visible:outline-none"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            className="absolute right-2 inline-flex size-7 items-center justify-center rounded-full bg-transparent p-0 text-muted hover:bg-surface"
            onClick={clear}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Resultados de la búsqueda"
        hidden={!showList}
        className="absolute top-full right-0 left-0 mt-2 max-h-88 overflow-auto rounded-md border border-border bg-bg p-1 shadow-md"
        // Evita que el campo pierda el foco (y cierre la lista) antes del clic.
        onMouseDown={(e) => e.preventDefault()}
      >
        {showList &&
          results.map((place, i) => (
            <li
              key={place.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                'flex cursor-pointer flex-col rounded-sm px-3 py-2',
                i === activeIndex && 'bg-primary-soft',
              )}
              onClick={() => choose(place)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="font-medium">{place.name}</span>
              <span className="text-xs text-muted">{CATEGORY_LABEL[place.category]}</span>
            </li>
          ))}
      </ul>

      {showEmpty && (
        <p role="status" className="absolute top-full right-0 left-0 mt-2 rounded-md border border-border bg-bg px-4 py-3 text-muted shadow-md">
          No encontramos ese lugar
        </p>
      )}
    </div>
  )
}
