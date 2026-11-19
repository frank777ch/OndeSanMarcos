import { CAMPUS } from '@/features/map/constants/campus'
import { pointAlong } from '@/features/map/utils/pointAlong'
import { pathLength, type Coord } from '@/features/routing/utils/distance'
import { useRouteStore } from '@/features/routing/store/useRouteStore'

/** Segundos que se queda en el destino antes de volver a empezar. */
const REST_SECONDS = 2
const TICK_MS = 1000

interface Options {
  /** Velocidad al caminar, en m/s (una persona: ~1,4). */
  speed: number
}

/**
 * Solo para desarrollo: sustituye `navigator.geolocation` por una ubicación simulada que recorre la ruta activa
 * a `speed` m/s, descansa unos segundos al llegar y repite. Sin ruta, se queda en el centro del campus.
 * Devuelve cómo deshacerlo.
 */
export function startLocationSimulation({ speed }: Options): () => void {
  const watchers = new Map<number, PositionCallback>()
  let nextId = 1
  let meters = 0
  let restTicks = 0
  let lastRoute: unknown = null
  let current: Coord = CAMPUS.center

  const reading = (coords: Coord): GeolocationPosition =>
    ({ coords: { longitude: coords[0], latitude: coords[1], accuracy: 5 }, timestamp: Date.now() }) as GeolocationPosition

  const tick = () => {
    const route = useRouteStore.getState().activeRoute
    if (route !== lastRoute) {
      lastRoute = route
      meters = 0
      restTicks = 0
    }
    if (!route) {
      current = CAMPUS.center
    } else {
      const total = pathLength(route.path)
      if (restTicks > 0) {
        if (--restTicks === 0) meters = 0
      } else {
        meters = Math.min(total, meters + speed * (TICK_MS / 1000))
        if (meters >= total) restTicks = REST_SECONDS
      }
      current = pointAlong(route.path, meters)
    }
    watchers.forEach((callback) => callback(reading(current)))
  }

  const geolocation = {
    watchPosition: (success: PositionCallback) => {
      const id = nextId++
      watchers.set(id, success)
      // Un GPS real entrega una primera lectura enseguida.
      queueMicrotask(() => watchers.get(id)?.(reading(current)))
      return id
    },
    clearWatch: (id: number) => {
      watchers.delete(id)
    },
    getCurrentPosition: (success: PositionCallback) => success(reading(current)),
  }

  const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation')
  const originalPermissions = Object.getOwnPropertyDescriptor(navigator, 'permissions')
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geolocation })
  // Con el permiso «concedido» no sale el aviso ni se bloquea el seguimiento.
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: { query: async () => ({ state: 'granted', addEventListener() {}, removeEventListener() {} }) },
  })

  const timer = setInterval(tick, TICK_MS)
  console.info(`[simulación] Ubicación simulada a ${speed} m/s. Planifica una ruta y elige un avatar.`)

  return () => {
    clearInterval(timer)
    watchers.clear()
    for (const [key, descriptor] of [['geolocation', original], ['permissions', originalPermissions]] as const) {
      if (descriptor) Object.defineProperty(navigator, key, descriptor)
      else delete (navigator as unknown as Record<string, unknown>)[key]
    }
  }
}
