import { CategoryChips } from './CategoryChips'
import { PlaceCard } from './PlaceCard'
import { PlaceSearch } from './PlaceSearch'

/**
 * Columna izquierda sobre el mapa: buscador y filtros arriba, ficha abajo.
 * Comparten contenedor para que la ficha nunca tape al buscador.
 */
export function MapOverlay() {
  return (
    // right-18: deja libres los controles de zoom. bottom-10: deja visibles el
    // logo y la atribución de Mapbox. Solo los hijos reciben el puntero.
    <div className="pointer-events-none absolute top-4 right-18 bottom-10 left-4 flex flex-col items-start gap-3 *:pointer-events-auto">
      <div className="flex flex-none flex-col items-start gap-3 *:pointer-events-auto">
        <PlaceSearch />
        <CategoryChips />
      </div>
      <PlaceCard />
    </div>
  )
}
