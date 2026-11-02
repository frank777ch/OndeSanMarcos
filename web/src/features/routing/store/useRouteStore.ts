import { create } from 'zustand'
import { useLocationStore } from '../../map/store/useLocationStore'
import { planRoute, type PlannedRoute, type RoutePoint, type RouteResult } from '../utils/planRoute'

export type RouteStatus = 'idle' | 'locating' | 'calculating' | 'done'

interface RouteState {
  open: boolean
  origin: RoutePoint | null
  destination: RoutePoint | null
  status: RouteStatus
  /** Resultado del último cálculo; `null` si falta origen o destino. */
  result: RouteResult | null
  /** Ruta que se está dibujando en el mapa (la última que se inició); independiente de lo que se edite en el diálogo. */
  activeRoute: PlannedRoute | null
  /** Mensaje cuando «Mi ubicación» no se pudo usar. */
  notice: string | null
  openDialog: (destinationId?: string) => void
  closeDialog: () => void
  setOrigin: (point: RoutePoint | null) => void
  setDestination: (point: RoutePoint | null) => void
  swap: () => void
  /** Dibuja la ruta calculada y cierra el diálogo. No hace nada si no hay una ruta válida. */
  startRoute: () => void
  clearActiveRoute: () => void
  chooseMyLocation: () => Promise<void>
}

export const NO_LOCATION_NOTICE = 'No podemos usar tu ubicación. Elige un lugar como punto de partida.'
export const LOCATE_FAILED_NOTICE = 'No pudimos obtener tu ubicación.'

/** Descarta resultados de cálculos que el usuario ya dejó atrás (RF-13.25). */
let requestId = 0

export const useRouteStore = create<RouteState>((set, get) => {
  const recompute = () => {
    const id = ++requestId
    const { origin, destination } = get()
    if (!origin || !destination) {
      set({ status: 'idle', result: null })
      return
    }
    set({ status: 'calculating', result: null })
    // Un turno al navegador para que el indicador se pinte antes del cálculo.
    setTimeout(() => {
      if (id !== requestId) return
      set({ status: 'done', result: planRoute(origin, destination) })
    }, 0)
  }

  return {
    open: false,
    origin: null,
    destination: null,
    status: 'idle',
    result: null,
    activeRoute: null,
    notice: null,

    openDialog: (destinationId) => {
      set({ open: true, notice: null })
      if (destinationId) get().setDestination({ kind: 'place', placeId: destinationId })
    },
    closeDialog: () => set({ open: false }),

    setOrigin: (point) => {
      set({ origin: point, notice: null })
      recompute()
    },
    setDestination: (point) => {
      set({ destination: point })
      recompute()
    },
    swap: () => {
      set((s) => ({ origin: s.destination, destination: s.origin, notice: null }))
      recompute()
    },

    startRoute: () => {
      const { result } = get()
      if (result?.ok) set({ activeRoute: result.route, open: false })
    },
    clearActiveRoute: () => set({ activeRoute: null }),

    chooseMyLocation: async () => {
      const { permission } = useLocationStore.getState()
      if (permission === 'denied' || permission === 'unsupported') {
        set({ notice: NO_LOCATION_NOTICE })
        return
      }
      requestId++
      set({ status: 'locating', result: null, notice: null })
      const position = await useLocationStore.getState().locate()
      if (position) {
        get().setOrigin({ kind: 'my-location', coordinates: position.coordinates })
        return
      }
      // Si la lectura falló porque se negó el permiso, el mensaje es el de «sin ubicación».
      const denied = useLocationStore.getState().permission === 'denied'
      get().setOrigin(null)
      set({ notice: denied ? NO_LOCATION_NOTICE : LOCATE_FAILED_NOTICE })
    },
  }
})
