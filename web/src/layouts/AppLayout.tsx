import { useMatch } from 'react-router-dom'
import { MapPinned, MessageCircle } from 'lucide-react'
import { SidebarShell, type SidebarLink } from './SidebarShell'

const links: SidebarLink[] = [
  { to: '/mapa', label: 'Mapa', icon: MapPinned },
  { to: '/asistente', label: 'Asistente', icon: MessageCircle },
]

export function AppLayout() {
  // En el mapa la barra va encima y el mapa ocupa todo el ancho (ver SidebarShell).
  const overMap = useMatch('/mapa') !== null
  return <SidebarShell links={links} navLabel="Principal" overContent={overMap} />
}
