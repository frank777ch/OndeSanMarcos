export const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_BYTES = 72

export interface PasswordForm {
  current: string
  next: string
  confirm: string
}

export type PasswordErrors = Partial<Record<keyof PasswordForm, string>>

/** Validación previa al envío (RF-37.12); el servidor repite las mismas reglas. */
export function validatePasswordForm({ current, next, confirm }: PasswordForm): PasswordErrors {
  const errors: PasswordErrors = {}
  if (!current) errors.current = 'Escribe tu contraseña actual.'
  if (!next) errors.next = 'Escribe la contraseña nueva.'
  else if (next.length < MIN_PASSWORD_LENGTH) errors.next = `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  else if (new TextEncoder().encode(next).length > MAX_PASSWORD_BYTES) errors.next = 'Es demasiado larga.'
  else if (!/\p{L}/u.test(next) || !/\d/.test(next)) errors.next = 'Debe incluir al menos una letra y un número.'
  else if (next === current) errors.next = 'Debe ser distinta de la actual.'
  if (!confirm) errors.confirm = 'Repite la contraseña nueva.'
  else if (next && confirm !== next) errors.confirm = 'No coincide con la contraseña nueva.'
  return errors
}
