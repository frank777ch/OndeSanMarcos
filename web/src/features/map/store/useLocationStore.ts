import { create } from 'zustand'
import {
  hasGeolocation,
  LocationError,
  queryPermission,
  readPosition,
  watchPermissionChange,
  type UserPosition,
} from '../utils/geolocation'

export type LocationPermission = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'

/** Clave de pestaña: «Ahora no» no vuelve a mostrar el aviso mientras la pestaña siga abierta. */
export const NOTICE_DISMISSED_KEY = 'osm:location-notice-dismissed'

function noticeWasDismissed(): boolean {
  try {
    return sessionStorage.getItem(NOTICE_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function rememberDismissed() {
  try {
    sessionStorage.setItem(NOTICE_DISMISSED_KEY, '1')
  } catch {
    // Sin sessionStorage el aviso volverá a salir: no es grave.
  }
}

interface LocationState {
  permission: LocationPermission
  noticeOpen: boolean
  /** Última posición obtenida con el botón; `null` si nunca se obtuvo. */
  position: UserPosition | null
  locating: boolean
  /** Consulta el permiso y abre el aviso si corresponde. Devuelve cómo dejar de escuchar cambios. */
  init: () => () => void
  dismissNotice: () => void
  /** Cierra el aviso y deja que el navegador pida el permiso. La lectura se descarta. */
  allow: () => Promise<void>
  /** Lee la ubicación y la guarda. `null` si no se pudo. */
  locate: () => Promise<UserPosition | null>
}

export const useLocationStore = create<LocationState>((set, get) => ({
  permission: 'unknown',
  noticeOpen: false,
  position: null,
  locating: false,

  init: () => {
    if (!hasGeolocation()) {
      set({ permission: 'unsupported', noticeOpen: false })
      return () => {}
    }
    let active = true
    void queryPermission().then((state) => {
      if (!active) return
      set({
        permission: state,
        noticeOpen: state === 'prompt' && !noticeWasDismissed() && !get().noticeOpen,
      })
    })
    const stopWatching = watchPermissionChange((state) => {
      set((s) => ({ permission: state, noticeOpen: state === 'prompt' ? s.noticeOpen : false }))
    })
    return () => {
      active = false
      stopWatching()
    }
  },

  dismissNotice: () => {
    rememberDismissed()
    set({ noticeOpen: false })
  },

  allow: async () => {
    set({ noticeOpen: false })
    try {
      await readPosition()
      set({ permission: 'granted' })
    } catch (e) {
      if (e instanceof LocationError && e.denied) set({ permission: 'denied' })
    }
  },

  locate: async () => {
    if (get().locating) return null
    set({ locating: true })
    try {
      const position = await readPosition()
      set({ position, permission: 'granted' })
      return position
    } catch (e) {
      if (e instanceof LocationError && e.denied) set({ permission: 'denied' })
      return null
    } finally {
      set({ locating: false })
    }
  },
}))
