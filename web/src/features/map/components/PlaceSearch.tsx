import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Search, X } from 'lucide-react'
import { PLACE_CATEGORIES, PLACES, type Place } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import { MIN_QUERY_LENGTH, normalizeText, searchPlaces } from '../utils/search'
import styles from './PlaceSearch.module.css'

const CATEGORY_LABEL = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<string, string>

export function PlaceSearch() {
  const baseId = useId()
  const listId = `${baseId}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const selectPlace = useMapStore((s) => s.selectPlace)
  const clearSelection = useMapStore((s) => s.clearSelection)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

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
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className={styles.search}>
      <div className={styles.field}>
        <Search size={18} aria-hidden="true" className={styles.icon} />
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
          className={styles.input}
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
            className={styles.clear}
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
        className={styles.list}
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
              className={[styles.option, i === activeIndex && styles.highlighted]
                .filter(Boolean)
                .join(' ')}
              onClick={() => choose(place)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className={styles.name}>{place.name}</span>
              <span className={styles.category}>{CATEGORY_LABEL[place.category]}</span>
            </li>
          ))}
      </ul>

      {showEmpty && (
        <p role="status" className={styles.empty}>
          No encontramos ese lugar
        </p>
      )}
    </div>
  )
}
