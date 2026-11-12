import { create } from 'zustand'
import { loginRequest } from '@/services/api/authApi'
import type { AdminSession } from '../types'

const SESSION_KEY = 'osm:admin-session'

function readSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'number') return null
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return { token: parsed.token, expiresAt: parsed.expiresAt }
  } catch {
    return null
  }
}

function writeSession(session: AdminSession | null): void {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // Sin sessionStorage la sesión dura mientras no se recargue: no es grave.
  }
}

interface AuthState {
  session: AdminSession | null
  /** `true` si la sesión se cerró porque el servidor la rechazó (hay que avisar al usuario). */
  expired: boolean
  login: (username: string, password: string) => Promise<void>
  logout: (reason?: 'expired') => void
  clearExpired: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readSession(),
  expired: false,
  async login(username, password) {
    const session = await loginRequest(username, password)
    writeSession(session)
    set({ session, expired: false })
  },
  logout(reason) {
    writeSession(null)
    set({ session: null, expired: reason === 'expired' })
  },
  clearExpired: () => set({ expired: false }),
}))
