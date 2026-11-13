/** Cursor del lienzo (pointer sobre lugares y ruta). */
export function setCursor(canvas: HTMLElement, cursor: '' | 'pointer') {
  canvas.style.cursor = cursor
}

/** Pantalla táctil sin cursor (la «X» de la ruta se fija al tocar en vez de seguir al cursor). */
export const isCoarsePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

/** ¿Alguno de los objetos tocados es la zona de la ruta? La ruta tiene prioridad sobre los lugares (RF-40.12). */
export const hitsRoute = (intersections: { object: { userData: Record<string, unknown> } }[]) =>
  intersections.some((i) => i.object.userData.routeHit === true)
