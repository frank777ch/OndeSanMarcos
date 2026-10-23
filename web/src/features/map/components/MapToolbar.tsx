import { CategoryChips } from './CategoryChips'
import { PlaceSearch } from './PlaceSearch'
import styles from './MapToolbar.module.css'

/** Búsqueda y filtros apilados arriba a la izquierda del mapa. */
export function MapToolbar() {
  return (
    <div className={styles.toolbar}>
      <PlaceSearch />
      <CategoryChips />
    </div>
  )
}
