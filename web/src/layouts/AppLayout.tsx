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
    <div className="grid h-full grid-cols-[15rem_1fr] overflow-hidden">
      <aside className="flex flex-col gap-8 border-r border-border bg-surface px-4 py-6">
        <div className="font-display text-xl font-bold whitespace-nowrap text-primary">
          OndeSanMarcos
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md p-3 font-medium no-underline',
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
      <main className="relative min-w-0 overflow-auto">
        <Outlet />
      </main>
      <ToastHost />
    </div>
  )
}
