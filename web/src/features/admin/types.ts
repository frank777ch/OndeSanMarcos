/** Sesión del administrador: solo el token y cuándo vence (nunca la contraseña). */
export interface AdminSession {
  token: string
  /** Milisegundos desde epoch. */
  expiresAt: number
}
