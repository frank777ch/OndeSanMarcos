import { create } from 'zustand'
import type { LngLat } from '../constants/campus'
import { toLocal, type Local } from '../utils/projection'
import {
  type Box,
  cameraBounds,
  campusPoints,
  CAMPUS_VIEW,
  clampDistance,
  fitCamera,
  type Padding,
  zoomToDistance,
} from './cameraMath'

/** Inclinación de la vista 3D (rad desde la vertical) y de la 2D, que no llega a 0 para no degenerar la cámara. */
export const TILT_3D = CAMPUS_VIEW.polar
export const TILT_2D = 1e-4

export interface CameraPose {
  target: Local
  distance: number
  polar: number
  azimuth: number
}

/** Lo que la escena le ofrece al store para mover la cámara real. */
export interface CameraApi {
  pose(): CameraPose
  size(): { width: number; height: number }
  animateTo(pose: CameraPose, duration: number): void
  /** Punto del mundo (x, y, z en metros) → píxeles del lienzo; `visible` es falso si queda fuera del lienzo y `behind` si queda detrás de la cámara. */
  project(point: [number, number, number]): { x: number; y: number; visible: boolean; behind: boolean }
}

/** Funciones que se llaman tras pintar cada cuadro (para mover los nombres de los lugares, que son DOM). */
export const frameListeners = new Set<() => void>()

interface CameraState {
  /** Vista cenital (2D). Sigue a la inclinación real, también si el usuario la cambia con el mouse (RF-40.7). */
  flat: boolean
  /** Punto fuera del campus (la ubicación del usuario) que amplía los límites de la cámara (RF-40.6). */
  extra: LngLat | null
  /** La cámara está lo bastante cerca como para mostrar los nombres de los lugares. */
  labels: boolean
  api: CameraApi | null
  register: (api: CameraApi | null) => void
  /** Sincroniza `flat` con la inclinación real de la cámara (al terminar un gesto o una animación). */
  syncFlat: (flat: boolean) => void
  syncLabels: (labels: boolean) => void
  setExtra: (point: LngLat | null) => void
  bounds: () => Box
  /** Cambia entre vista 3D e inclinada y vista 2D cenital, con una transición. */
  setFlat: (flat: boolean) => void
  /** Vuela hasta un punto; sin `zoom`/`distance` conserva la distancia actual (RF-40.10). */
  flyTo: (point: LngLat, options?: { zoom?: number; distance?: number; duration?: number }) => void
  /** Encuadra los puntos dentro del área libre del lienzo, conservando inclinación y orientación (RF-40.11). */
  fitPoints: (points: LngLat[], padding: Padding, options?: { maxZoom?: number; duration?: number }) => void
  /** Vuelve a la vista inicial del campus (RF-40.14). */
  resetToCampus: (padding?: Padding, duration?: number) => void
}

export const useCameraStore = create<CameraState>((set, get) => ({
  flat: false,
  extra: null,
  labels: true,
  api: null,

  register: (api) => set({ api }),
  syncFlat: (flat) => set((s) => (s.flat === flat ? s : { flat })),
  syncLabels: (labels) => set((s) => (s.labels === labels ? s : { labels })),
  setExtra: (extra) => set({ extra }),
  bounds: () => cameraBounds(get().extra),

  setFlat: (flat) => {
    const { api } = get()
    if (!api) return
    set({ flat })
    api.animateTo({ ...api.pose(), polar: flat ? TILT_2D : TILT_3D }, 800)
  },

  flyTo: (point, { zoom, distance, duration = 1500 } = {}) => {
    const { api } = get()
    if (!api) return
    const pose = api.pose()
    const target = toLocal(point)
    const d = distance ?? (zoom !== undefined ? zoomToDistance(zoom) : pose.distance)
    api.animateTo({ ...pose, target, distance: clampDistance(d) }, duration)
  },

  fitPoints: (points, padding, { maxZoom, duration = 2000 } = {}) => {
    const { api } = get()
    if (!api || !points.length) return
    const pose = api.pose()
    const { width, height } = api.size()
    const fit = fitCamera({
      points,
      padding,
      width,
      height,
      polar: pose.polar,
      azimuth: pose.azimuth,
      maxDistance: undefined,
    })
    const minDistance = maxZoom !== undefined ? zoomToDistance(maxZoom) : 0
    api.animateTo({ ...pose, target: fit.target, distance: Math.max(fit.distance, minDistance) }, duration)
  },

  resetToCampus: (padding = { top: 0, bottom: 0, left: 0, right: 0 }, duration = 1500) => {
    const { api } = get()
    if (!api) return
    set({ flat: false })
    const { width, height } = api.size()
    const { target, distance } = fitCamera({
      points: campusPoints(),
      padding,
      width,
      height,
      polar: TILT_3D,
      azimuth: CAMPUS_VIEW.azimuth,
    })
    api.animateTo({ target, distance, polar: TILT_3D, azimuth: CAMPUS_VIEW.azimuth }, duration)
  },
}))

