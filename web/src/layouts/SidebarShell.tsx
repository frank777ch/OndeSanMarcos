import { useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { PanelLeft, type LucideIcon } from 'lucide-react'
import { ToastHost } from '@/components/Toast/ToastHost'
import { cn } from '@/lib/cn'

export interface SidebarLink {
  to: string
  label: string
  icon: LucideIcon
  /** Solo activo en la ruta exacta (para enlaces de índice como `/admin`). */
  end?: boolean
}

interface SidebarShellProps {
  links: SidebarLink[]
  /** Nombre accesible de la navegación. */
  navLabel: string
  /** El contenido ocupa todo el ancho y la barra va encima (el mapa no se redimensiona). */
  overContent?: boolean
  /** Contenido al pie de la barra; recibe si está contraída. */
  footer?: (collapsed: boolean) => ReactNode
}

const COLLAPSED_KEY = 'osm:sidebar-collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Barra lateral contraíble + área de contenido, compartida por la web pública y la de administración. */
export function SidebarShell({ links, navLabel, overContent = false, footer }: SidebarShellProps) {
  // Solo aplica desde md (barra lateral); en móvil la barra de abajo no cambia.
  const [collapsed, setCollapsed] = useState(readCollapsed)
  // Con `overContent` (el mapa) la barra va encima y el contenido ocupa todo el ancho: así no se
  // redimensiona al cambiar la barra (con la cámara 3D, redimensionar deforma la perspectiva).

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      // Sin localStorage la preferencia no se recuerda: no es grave.
    }
  }

  return (
    <div
      // --sidebar-w lo leen la barra, el contenido y los controles del mapa (ver index.css).
      style={{ '--sidebar-w': collapsed ? '4.5rem' : '17rem' } as CSSProperties}
      className="relative flex h-full flex-col overflow-hidden"
    >
      {/* En móvil la barra va fija abajo del todo (después de <main>); desde md es la barra lateral. */}
      <aside
        id="sidebar"
        className="order-2 flex-none border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:absolute md:inset-y-0 md:left-0 md:z-30 md:flex md:w-[var(--sidebar-w)] md:flex-col md:gap-8 md:overflow-hidden md:border-t-0 md:border-r md:px-3 md:py-6 motion-safe:md:transition-[width] motion-safe:md:duration-300 motion-safe:md:ease-in-out"
      >
        <div className="hidden items-center md:flex">
          <span
            aria-hidden={collapsed}
            className={cn(
              'shrink-0 overflow-hidden font-display text-xl font-bold whitespace-nowrap text-primary motion-safe:transition-[max-width,opacity,padding] motion-safe:duration-300 motion-safe:ease-in-out',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-64 pl-3 opacity-100',
            )}
          >
            OndeSanMarcos
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            aria-expanded={!collapsed}
            aria-controls="sidebar"
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            className="ml-auto inline-flex size-12 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted transition-colors hover:bg-surface-strong hover:text-ink"
          >
            <PanelLeft size={22} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={navLabel} className="grid grid-cols-2 md:flex md:flex-col md:gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium no-underline md:flex-row md:gap-0 md:rounded-md md:p-3 md:text-base',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted hover:bg-surface-strong',
                )
              }
            >
              <Icon size={20} aria-hidden="true" className="shrink-0" />
              {/* El texto sigue en el DOM al contraer: el nombre accesible del enlace no cambia. */}
              <span
                className={cn(
                  'md:overflow-hidden md:whitespace-nowrap motion-safe:md:transition-[max-width,opacity,margin] motion-safe:md:duration-300 motion-safe:md:ease-in-out',
                  collapsed ? 'md:ml-0 md:max-w-0 md:opacity-0' : 'md:ml-3 md:max-w-40 md:opacity-100',
                )}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
        {footer && <div className="hidden md:mt-auto md:block">{footer(collapsed)}</div>}
      </aside>
      <main
        className={cn(
          'relative min-h-0 min-w-0 flex-1 overflow-auto md:absolute md:inset-y-0 md:right-0',
          // Con el contenido bajo la barra (mapa) no se anima `left`: animarlo obligaba al mapa a redimensionarse
          // en cada fotograma y se veía a tirones.
          overContent
            ? 'md:left-0'
            : 'md:left-[var(--sidebar-w)] motion-safe:md:transition-[left] motion-safe:md:duration-300 motion-safe:md:ease-in-out',
        )}
      >
        <Outlet />
      </main>
      <ToastHost />
    </div>
  )
}
