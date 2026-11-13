import { LogOut, MapPin, Tags, UserRound } from 'lucide-react'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { cn } from '@/lib/cn'
import { SidebarShell, type SidebarLink } from './SidebarShell'

const links: SidebarLink[] = [
  { to: '/admin/lugares', label: 'Lugares', icon: MapPin },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/perfil', label: 'Perfil', icon: UserRound },
]

/** Misma barra lateral que la web pública, con las pestañas de administración y «Cerrar sesión» al pie. */
export function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  return (
    <SidebarShell
      links={links}
      navLabel="Administración"
      footer={(collapsed) => (
        <button
          type="button"
          onClick={() => logout()}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className="flex w-full items-center rounded-md border-0 bg-transparent p-3 text-base font-medium text-muted hover:bg-surface-strong"
        >
          <LogOut size={20} aria-hidden="true" className="shrink-0" />
          <span
            className={cn(
              'overflow-hidden whitespace-nowrap motion-safe:transition-[max-width,opacity,margin] motion-safe:duration-300 motion-safe:ease-in-out',
              collapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-3 max-w-40 opacity-100',
            )}
          >
            Cerrar sesión
          </span>
        </button>
      )}
    />
  )
}
