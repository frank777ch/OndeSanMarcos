import { CategoryChips } from './CategoryChips'
import { PlaceCard } from './PlaceCard'
import { PlaceSearch } from './PlaceSearch'

/**
 * Columna izquierda sobre el mapa: buscador y filtros arriba, ficha abajo.
 * Comparten contenedor para que la ficha nunca tape al buscador.
 */
export function MapOverlay() {
  return (
    // bottom-10: deja visibles el logo y la atribución de Mapbox. Solo los hijos reciben el puntero.
    <div className="pointer-events-none absolute top-4 right-4 bottom-10 left-4 md:left-[calc(var(--sidebar-w)+1rem)] motion-safe:md:transition-[left] motion-safe:md:duration-300 motion-safe:md:ease-in-out flex flex-col items-start gap-3 *:pointer-events-auto">
      <div className="flex w-full min-w-0 flex-none flex-col items-start gap-3 *:pointer-events-auto">
        <PlaceSearch />
        <CategoryChips />
      </div>
      <PlaceCard />
    </div>
  )
}
