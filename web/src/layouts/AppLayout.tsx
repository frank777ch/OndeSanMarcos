import { lazy, Suspense, useEffect, useState } from 'react'
import { useMatch } from 'react-router-dom'
import { MapPinned, MessageCircle } from 'lucide-react'
import { MapActiveContext } from '@/features/map/MapActiveContext'
import { cn } from '@/lib/cn'
import { SidebarShell, type SidebarLink } from './SidebarShell'

const links: SidebarLink[] = [
  { to: '/mapa', label: 'Mapa', icon: MapPinned },
  { to: '/asistente', label: 'Asistente', icon: MessageCircle },
]

// Carga diferida: three.js pesa mucho y va en su propio chunk.
const loadMapPage = () => import('@/pages/MapPage')
const MapPage = lazy(() => loadMapPage().then((m) => ({ default: m.MapPage })))

/**
 * El mapa se crea una sola vez y se queda montado: oculto fuera de /mapa, así al volver
 * aparece al instante (sin recrear WebGL ni la geometría) y conserva cámara, selección y ruta.
 */
function PersistentMap({ active }: { active: boolean }) {
  const [visited, setVisited] = useState(active)
  if (active && !visited) setVisited(true)

  // Precarga el código del mapa en reposo, para que la primera visita tampoco espere.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1000))
    const id = idle(() => void loadMapPage())
    return () => {
      if (window.cancelIdleCallback && typeof id === 'number') window.cancelIdleCallback(id)
    }
  }, [])

  if (!visited) return null
  return (
    // El contenedor sigue a <main> (se desliza con él y recorta lo que sobra); el mapa de dentro tiene
    // ancho fijo (el de la pantalla) anclado a la izquierda: se mueve con el slide pero no se redimensiona
    // (redimensionar deforma la cámara 3D).
    // `invisible` (y no `hidden`) conserva el tamaño del lienzo; `inert` lo saca del foco y del lector de pantalla.
    <div className={cn('absolute inset-0 overflow-hidden', !active && 'invisible')} inert={!active}>
      <div className="relative h-full w-full md:w-screen">
        <MapActiveContext.Provider value={active}>
          <Suspense fallback={null}>
            <MapPage />
          </Suspense>
        </MapActiveContext.Provider>
      </div>
    </div>
  )
}

export function AppLayout() {
  // En el mapa la barra va encima y el mapa ocupa todo el ancho (ver SidebarShell).
  const overMap = useMatch('/mapa') !== null
  return (
    <SidebarShell
      links={links}
      navLabel="Principal"
      overContent={overMap}
      persistent={<PersistentMap active={overMap} />}
    />
  )
}
