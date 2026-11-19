import { create } from 'zustand'
import { findAvatar } from './avatars'

export const AVATAR_KEY = 'osm:avatar'

function stored(): string | null {
  try {
    const id = localStorage.getItem(AVATAR_KEY)
    return findAvatar(id) ? id : null
  } catch {
    return null
  }
}

interface AvatarState {
  /** Avatar elegido; `null` si no se quiere ninguno. */
  avatarId: string | null
  setAvatar: (id: string | null) => void
}

export const useAvatarStore = create<AvatarState>((set) => ({
  avatarId: stored(),
  setAvatar: (id) => {
    const next = findAvatar(id) ? id : null
    try {
      if (next) localStorage.setItem(AVATAR_KEY, next)
      else localStorage.removeItem(AVATAR_KEY)
    } catch {
      // Sin localStorage la elección no se recuerda: no es grave.
    }
    set({ avatarId: next })
  },
}))
