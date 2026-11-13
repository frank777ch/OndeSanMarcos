import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { ApiError, apiClient } from './client'

/**
 * Único punto de la web que llama a la API con el token del administrador (RF-26.18).
 * Si el servidor rechaza la sesión (401), la cierra y avisa (RF-26.17).
 */
async function authenticated<T>(call: (headers: Record<string, string>) => Promise<T>): Promise<T> {
  const session = useAuthStore.getState().session
  if (!session) throw new ApiError('http', 'sin sesión de administrador', 401)
  try {
    return await call({ Authorization: `Bearer ${session.token}` })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      useAuthStore.getState().logout('expired')
    }
    throw error
  }
}

export const adminClient = {
  get: <T>(endpoint: string) => authenticated((headers) => apiClient.get<T>(endpoint, headers)),
  post: <T>(endpoint: string, body: unknown) =>
    authenticated((headers) => apiClient.post<T>(endpoint, body, headers)),
  put: <T>(endpoint: string, body: unknown) =>
    authenticated((headers) => apiClient.put<T>(endpoint, body, headers)),
  delete: <T>(endpoint: string) => authenticated((headers) => apiClient.delete<T>(endpoint, headers)),
}

/** Datos del administrador autenticado (`GET /api/auth/me`). */
export interface AdminProfile {
  username: string
  /** Fecha de alta. */
  createdAt: Date
}

/** `GET /api/auth/me`: datos de la cuenta; también confirma que la sesión sigue siendo válida. */
export async function fetchMe(): Promise<AdminProfile> {
  const raw = await adminClient.get<{ username: string; created_at?: string }>('/api/auth/me')
  return { username: raw.username, createdAt: new Date(raw.created_at ?? '') }
}

/** `POST /api/auth/change-password` (HU-37). Responde 204; los errores llegan como `ApiError`. */
export const changePassword = (currentPassword: string, newPassword: string) =>
  adminClient.post<void>('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
