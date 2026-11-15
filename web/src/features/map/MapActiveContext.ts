import { createContext, useContext } from 'react'

/** El mapa está a la vista. Con el mapa persistente (oculto en otras pestañas) sus atajos de teclado deben callar. */
export const MapActiveContext = createContext(true)

export const useMapActive = () => useContext(MapActiveContext)
