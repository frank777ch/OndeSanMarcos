/** Longitud máxima de una pregunta (límite del backend). */
export const MAX_QUERY_LENGTH = 1000

/** Pregunta lista para enviar: sin espacios en los extremos y de hasta 1000 caracteres. `''` si no hay nada. */
export function normalizeQuery(text: string): string {
  return text.trim().slice(0, MAX_QUERY_LENGTH).trim()
}
