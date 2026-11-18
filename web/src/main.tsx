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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
