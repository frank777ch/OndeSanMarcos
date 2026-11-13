import { useState, type ReactNode } from 'react'
import { Ellipsis, X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { cn } from '@/lib/cn'

export interface MapAction {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  busy?: boolean
}

/** Botón «…» que despliega las acciones del mapa hacia la izquierda; cada una muestra su nombre al pasar el cursor. */
export function MapActions({ actions }: { actions: MapAction[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute right-4 bottom-4 flex items-center gap-2">
      <div
        // inert: cerrado, las acciones no reciben foco ni clics.
        inert={!open}
        className={cn('flex items-center gap-2 transition-all duration-300 ease-out', !open && 'pointer-events-none')}
      >
        {actions.map((action, i) => (
          <div
            key={action.label}
            className={cn(
              'group relative transition-all duration-300 ease-out',
              open ? 'translate-x-0 opacity-100' : 'translate-x-6 scale-50 opacity-0',
            )}
            style={{ transitionDelay: `${(open ? (actions.length - 1 - i) : i) * 40}ms` }}
          >
            <IconButton
              label={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              aria-busy={action.busy}
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
        ))}
      </div>
      <IconButton
        label={open ? 'Cerrar acciones' : 'Más acciones'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={undefined}
      >
        {open ? <X size={20} /> : <Ellipsis size={20} />}
      </IconButton>
    </div>
  )
}
