import { NavLink, Outlet } from 'react-router-dom'
import { MapPinned, MessageCircle } from 'lucide-react'
import { ToastHost } from '@/components/Toast/ToastHost'
import { cn } from '@/lib/cn'

const links = [
  { to: '/mapa', label: 'Mapa', icon: MapPinned },
  { to: '/asistente', label: 'Asistente', icon: MessageCircle },
]

export function AppLayout() {
  return (
    <div className="flex h-full flex-col overflow-hidden md:grid md:grid-cols-[15rem_1fr]">
      {/* En móvil la barra va fija abajo del todo (después de <main>); desde md es la barra lateral. */}
      <aside className="order-2 flex-none border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:order-none md:flex md:flex-col md:gap-8 md:border-t-0 md:border-r md:px-4 md:py-6">
        <div className="hidden font-display text-xl font-bold whitespace-nowrap text-primary md:block">
          OndeSanMarcos
        </div>
        <nav aria-label="Principal" className="grid grid-cols-2 md:flex md:flex-col md:gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium no-underline md:flex-row md:gap-3 md:rounded-md md:p-3 md:text-base',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted hover:bg-surface-strong',
                )
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="relative min-h-0 min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
      <ToastHost />
    </div>
  )
}
