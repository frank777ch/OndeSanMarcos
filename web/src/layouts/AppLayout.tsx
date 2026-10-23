import { NavLink, Outlet } from 'react-router-dom'
import { MapPinned, MessageCircle } from 'lucide-react'
import { ToastHost } from '@/components/Toast/ToastHost'
import styles from './AppLayout.module.css'

const links = [
  { to: '/mapa', label: 'Mapa', icon: MapPinned },
  { to: '/asistente', label: 'Asistente', icon: MessageCircle },
]

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>OndeSanMarcos</div>
        <nav aria-label="Principal" className={styles.nav}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [styles.link, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
      <ToastHost />
    </div>
  )
}
