import { create } from 'zustand'

// TEMPORAL: visor de los caminos de OpenStreetMap para compararlos con campus-paths.json. Se quita al terminar.
interface WalkwaysDebugState {
  visible: boolean
  toggle: () => void
}

export const useWalkwaysDebug = create<WalkwaysDebugState>((set) => ({
  visible: false,
  toggle: () => set((s) => ({ visible: !s.visible })),
}))
