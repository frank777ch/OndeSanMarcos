/** Distancia (px) hacia arriba a partir de la cual soltar el asa cierra el panel. */
export const SHEET_CLOSE_THRESHOLD = 80

/** `dy` es el desplazamiento vertical del dedo: negativo si sube. */
export function shouldCloseSheet(dy: number, threshold: number = SHEET_CLOSE_THRESHOLD): boolean {
  return dy < -threshold
}
