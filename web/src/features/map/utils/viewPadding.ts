import type { Padding } from '../scene/cameraMath'

const EDGE_PADDING = 80
/** Espacio extra arriba para el buscador y los filtros, y abajo para la atribución. */
const TOP_PADDING = 140
const BOTTOM_PADDING = 100

/** Ancho (px) de la barra lateral, que va encima del mapa. Se lee de `--sidebar-w`. */
export function sidebarWidth(el: HTMLElement): number {
  const raw = getComputedStyle(el).getPropertyValue('--sidebar-w').trim()
  const value = parseFloat(raw)
  if (Number.isNaN(value)) return 0
  if (raw.endsWith('rem')) return value * parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
  return value
}

/** Relleno del encuadre: el área del mapa que no tapan la barra lateral, el buscador ni los filtros. */
export function viewPadding(el: HTMLElement | null): Padding {
  return {
    top: TOP_PADDING,
    bottom: BOTTOM_PADDING,
    right: EDGE_PADDING,
    left: EDGE_PADDING + (el ? sidebarWidth(el) : 0),
  }
}
