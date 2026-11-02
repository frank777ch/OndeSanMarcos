import type { LngLat } from '../constants/campus'

export type PermissionResult = 'granted' | 'denied' | 'prompt'

export interface UserPosition {
  coordinates: LngLat
  /** Precisión de la lectura, en metros. */
  accuracy: number
}

/** Error al leer la ubicación; `denied` es true si el usuario negó el permiso. */
export class LocationError extends Error {
  readonly denied: boolean
  constructor(denied: boolean, message: string) {
    super(message)
    this.denied = denied
  }
}

const PERMISSION_DENIED = 1

export function hasGeolocation(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/** Estado del permiso. Si el navegador no tiene la API de permisos, se asume `prompt`. */
export async function queryPermission(): Promise<PermissionResult> {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'prompt'
  }
}

/** Avisa cuando el usuario cambia el permiso desde el navegador. Devuelve cómo dejar de avisar. */
export function watchPermissionChange(onChange: (state: PermissionResult) => void): () => void {
  let cancelled = false
  let status: PermissionStatus | undefined
  const listener = () => {
    if (status) onChange(status.state)
  }
  navigator.permissions
    ?.query({ name: 'geolocation' })
    .then((s) => {
      if (cancelled) return
      status = s
      s.addEventListener('change', listener)
    })
    .catch(() => {})
  return () => {
    cancelled = true
    status?.removeEventListener('change', listener)
  }
}

/** Lee la ubicación del dispositivo una sola vez. */
export function readPosition(): Promise<UserPosition> {
  return new Promise((resolve, reject) => {
    if (!hasGeolocation()) {
      reject(new LocationError(false, 'Geolocalización no disponible'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          coordinates: [p.coords.longitude, p.coords.latitude],
          accuracy: p.coords.accuracy,
        }),
      (e) => reject(new LocationError(e.code === PERMISSION_DENIED, e.message)),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    )
  })
}
