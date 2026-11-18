import { useMemo } from 'react'
import { CalendarDays, LayoutGrid } from 'lucide-react'
import { getCategoryIcon } from '../categoryIcons'
import { useMapStore } from '../store/useMapStore'
import { selectVisibleCategories, usePlacesStore } from '../store/usePlacesStore'
import { selectUpcoming, useEventsStore } from '@/features/events/store/useEventsStore'
import { cn } from '@/lib/cn'

export function CategoryChips() {
  const activeCategory = useMapStore((s) => s.activeCategory)
  const eventsMode = useMapStore((s) => s.eventsMode)
  const toggleEventsMode = useMapStore((s) => s.toggleEventsMode)
  const events = useEventsStore((s) => s.events)
  const upcomingCount = useMemo(() => selectUpcoming(events).length, [events])
  const toggleCategory = useMapStore((s) => s.toggleCategory)
  const clearCategory = useMapStore((s) => s.clearCategory)
  const status = usePlacesStore((s) => s.status)
  const places = usePlacesStore((s) => s.places)
  const categories = usePlacesStore((s) => s.categories)
  const visible = useMemo(
    () => [...selectVisibleCategories({ places, categories })].sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [places, categories],
  )

  // Sin datos no hay botones (RF-28.3); las categorías sin lugares tampoco (RF-28.8).
  if (status !== 'ready') return null

  return (
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar lugares por categoría">
      {upcomingCount > 0 && (
        <>
          <button
            type="button"
            aria-pressed={eventsMode}
            className={cn(
              'inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors',
              eventsMode ? 'border-primary bg-primary text-on-primary' : 'border-border bg-bg text-ink hover:bg-surface',
            )}
            onClick={toggleEventsMode}
          >
            <CalendarDays size={16} aria-hidden="true" />
            Eventos
            <span className="rounded-full bg-black/10 px-1.5 text-xs">{upcomingCount}</span>
          </button>
          <span role="separator" aria-orientation="vertical" className="my-1 w-px flex-none bg-border" />
        </>
      )}
      <button
        type="button"
        aria-pressed={activeCategory === null && !eventsMode}
        className={cn(
          'inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors',
          activeCategory === null && !eventsMode
            ? 'border-primary bg-primary text-on-primary'
            : 'border-border bg-bg text-ink hover:bg-surface',
        )}
        onClick={clearCategory}
      >
        <LayoutGrid size={16} aria-hidden="true" />
        Todos
      </button>
      {visible.map(({ id, label, icon }) => {
        const Icon = getCategoryIcon(icon)
        const active = activeCategory === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            className={cn(
              'inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors',
              active
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-bg text-ink hover:bg-surface',
            )}
            onClick={() => toggleCategory(id)}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
