import { Route } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { useRouteStore } from '../store/useRouteStore'

/** Botón del mapa que abre el diálogo para planificar una ruta. */
export function RouteButton() {
  return (
    <IconButton label="Planificar ruta" onClick={() => useRouteStore.getState().openDialog()}>
      <Route size={20} />
    </IconButton>
  )
}
