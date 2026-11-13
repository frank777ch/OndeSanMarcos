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

/** `GET /api/auth/me`: confirma que la sesión sigue siendo válida. */
export const fetchMe = () => adminClient.get<{ username: string }>('/api/auth/me')
