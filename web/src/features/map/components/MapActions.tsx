import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { ChevronLeft, Ellipsis, X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { cn } from '@/lib/cn'

export interface MapAction {
  label: string
  icon: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  busy?: boolean
  /** Opción elegida (solo en submenús): se marca con un aro. */
  selected?: boolean
  /** Si tiene, al pulsarla las acciones se sustituyen por estas, con un botón para volver. */
  children?: MapAction[]
}

/** Un botón del menú: entra con el mismo despliegue escalonado cada vez que aparece. */
function ActionItem({ action, index, count, open }: { action: MapAction; index: number; count: number; open: boolean }) {
  // Al montarse (p. ej. al entrar a un submenú) parte oculto y se despliega en el siguiente cuadro.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const shown = open && mounted

  return (
    <div
      className={cn(
        'group relative transition-all duration-300 ease-out',
        shown ? 'translate-x-0 opacity-100' : 'translate-x-6 scale-50 opacity-0',
      )}
      style={{ transitionDelay: `${(shown ? count - 1 - index : index) * 40}ms` }}
    >
      <IconButton
        label={action.label}
        onClick={action.onClick}
        disabled={action.disabled}
        aria-busy={action.busy}
        aria-pressed={action.selected}
        className={cn(action.selected && 'ring-2 ring-accent')}
        title={undefined}
      >
        {action.icon}
      </IconButton>
      <span
        role="presentation"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-bg opacity-0 shadow-md transition-opacity group-hover:opacity-100"
      >
        {action.label}
      </span>
    </div>
  )
}

/** Botón «…» que despliega las acciones del mapa hacia la izquierda; cada una muestra su nombre al pasar el cursor. */
export function MapActions({ actions }: { actions: MapAction[] }) {
  const [open, setOpen] = useState(false)
  // Se guarda la etiqueta, no el objeto: las acciones se recrean en cada render del mapa.
  const [submenuLabel, setSubmenuLabel] = useState<string | null>(null)
  const parent = actions.find((a) => a.label === submenuLabel && a.children)

  const items: MapAction[] = parent
    ? [
        { label: 'Volver', icon: <ChevronLeft size={20} />, onClick: () => setSubmenuLabel(null) },
        ...(parent.children ?? []),
      ]
    : actions.map((a) => (a.children ? { ...a, onClick: () => setSubmenuLabel(a.label) } : a))

  const toggle = () => {
    setOpen((v) => !v)
    setSubmenuLabel(null)
  }

  return (
    <div className="absolute right-4 bottom-4 flex items-center gap-2">
      <div
        // inert: cerrado, las acciones no reciben foco ni clics.
        inert={!open}
        className={cn('flex items-center gap-2 transition-all duration-300 ease-out', !open && 'pointer-events-none')}
      >
        {items.map((action, i) => (
          <ActionItem
            // La clave incluye el submenú: al entrar o volver, los botones se vuelven a desplegar.
            key={`${submenuLabel ?? ''}/${action.label}`}
            action={action}
            index={i}
            count={items.length}
            open={open}
          />
        ))}
      </div>
      <IconButton
        label={open ? 'Cerrar acciones' : 'Más acciones'}
        aria-expanded={open}
        onClick={toggle}
        title={undefined}
      >
        {open ? <X size={20} /> : <Ellipsis size={20} />}
      </IconButton>
    </div>
  )
}
