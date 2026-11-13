import { useMemo } from 'react'
import {
  Building2,
  Coffee,
  ConciergeBell,
  DoorOpen,
  Dumbbell,
  HeartPulse,
  Landmark,
  MapPin,
  Mic,
  type LucideIcon,
} from 'lucide-react'
import { useMapStore } from '../store/useMapStore'
import { selectVisibleCategories, usePlacesStore } from '../store/usePlacesStore'
import { cn } from '@/lib/cn'

/** Icono por categoría; una categoría nueva (creada por el administrador) usa `MapPin`. */
const ICONS: Record<string, LucideIcon> = {
  facultades: Building2,
  cafeterias: Coffee,
  auditorios: Mic,
  'campos-deportivos': Dumbbell,
  puertas: DoorOpen,
  administracion: Landmark,
  salud: HeartPulse,
  servicios: ConciergeBell,
  otros: MapPin,
}

export function CategoryChips() {
  const activeCategory = useMapStore((s) => s.activeCategory)
  const toggleCategory = useMapStore((s) => s.toggleCategory)
  const status = usePlacesStore((s) => s.status)
  const places = usePlacesStore((s) => s.places)
  const categories = usePlacesStore((s) => s.categories)
  const visible = useMemo(() => selectVisibleCategories({ places, categories }), [places, categories])

  // Sin datos no hay botones (RF-28.3); las categorías sin lugares tampoco (RF-28.8).
  if (status !== 'ready') return null

  return (
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar lugares por categoría">
      {visible.map(({ id, label }) => {
        const Icon = ICONS[id] ?? MapPin
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
