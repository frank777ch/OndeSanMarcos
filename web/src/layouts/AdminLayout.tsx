import type { MouseEvent } from 'react'
import { LogOut, MapPin, Moon, Sun, Tags, UserRound, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { useThemeStore } from '@/features/theme/useThemeStore'
import { cn } from '@/lib/cn'
import { SidebarShell, type SidebarLink } from './SidebarShell'

const links: SidebarLink[] = [
  { to: '/admin/lugares', label: 'Lugares', icon: MapPin },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/perfil', label: 'Perfil', icon: UserRound },
]

interface FooterButtonProps {
  icon: LucideIcon
  label: string
  collapsed: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

/** Botón del pie de la barra: ícono solo al contraer, con su nombre en el título. */
function FooterButton({ icon: Icon, label, collapsed, onClick }: FooterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="flex w-full items-center rounded-md border-0 bg-transparent p-3 text-base font-medium text-muted hover:bg-surface-strong"
    >
      <Icon size={20} aria-hidden="true" className="shrink-0" />
      <span
        className={cn(
          'overflow-hidden whitespace-nowrap motion-safe:transition-[max-width,opacity,margin] motion-safe:duration-300 motion-safe:ease-in-out',
          collapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-3 max-w-40 opacity-100',
        )}
      >
        {label}
      </span>
    </button>
  )
}

/** Misma barra lateral que la web pública, con las pestañas de administración y, al pie, el tema y «Cerrar sesión». */
export function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  const dark = useThemeStore((s) => s.theme === 'dark')
  return (
    <SidebarShell
      links={links}
      navLabel="Administración"
      footer={(collapsed) => (
        <div className="flex flex-col gap-1">
          <FooterButton
            icon={dark ? Sun : Moon}
            label={dark ? 'Tema claro' : 'Tema oscuro'}
            collapsed={collapsed}
            onClick={(event) => {
              // El círculo del cambio de tema nace en el centro del botón.
              const box = event.currentTarget.getBoundingClientRect()
              useThemeStore.getState().toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
            }}
          />
          <FooterButton icon={LogOut} label="Cerrar sesión" collapsed={collapsed} onClick={() => logout()} />
        </div>
      )}
    />
  )
}
