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
import { PLACE_CATEGORIES, type PlaceCategoryId } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import { cn } from '@/lib/cn'

const ICONS: Record<PlaceCategoryId, LucideIcon> = {
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

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar lugares por categoría">
      {PLACE_CATEGORIES.map(({ id, label }) => {
        const Icon = ICONS[id]
        const active = activeCategory === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors',
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
