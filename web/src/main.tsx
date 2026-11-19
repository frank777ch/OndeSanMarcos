import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './features/theme/useThemeStore'
import { useEventsStore } from './features/events/store/useEventsStore'
import { usePlacesStore } from './features/map/store/usePlacesStore'

// Los lugares se piden al abrir la web, en cualquier ruta, y una sola vez (HU-28).
void usePlacesStore.getState().load()
void useEventsStore.getState().load()

// Solo en desarrollo: `/mapa?simular` (o `?simular=4`, en m/s) recorre la ruta activa como si caminaras por ella.
if (import.meta.env.DEV) {
  const speed = new URLSearchParams(location.search).get('simular')
  if (speed !== null) void import('./dev/simulateLocation').then((m) => m.startLocationSimulation({ speed: Number(speed) || 1.4 }))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
