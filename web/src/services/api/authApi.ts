import type { AdminSession } from '@/features/admin/types'
import { ApiError, apiClient } from './client'

interface LoginApiResponse {
  access_token?: unknown
  expires_in?: unknown
}

/** `POST /api/auth/login`: canjea usuario y contraseña por una sesión. */
export async function loginRequest(username: string, password: string): Promise<AdminSession> {
  const raw = await apiClient.post<LoginApiResponse>('/api/auth/login', { username, password })
  if (typeof raw?.access_token !== 'string' || typeof raw.expires_in !== 'number') {
    throw new ApiError('invalid', 'POST /api/auth/login: la respuesta no trae el token')
  }
  return { token: raw.access_token, expiresAt: Date.now() + raw.expires_in * 1000 }
}
