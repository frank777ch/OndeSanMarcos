import { CategoryChips } from './CategoryChips'
import { PlaceCard } from './PlaceCard'
import { PlaceSearch } from './PlaceSearch'
import styles from './MapOverlay.module.css'

/**
 * Columna izquierda sobre el mapa: buscador y filtros arriba, ficha abajo.
 * Comparten contenedor para que la ficha nunca tape al buscador.
 */
export function MapOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.top}>
        <PlaceSearch />
        <CategoryChips />
      </div>
      <PlaceCard />
    </div>
  )
}
