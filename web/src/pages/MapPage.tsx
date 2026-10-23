import { CampusMap } from '@/features/map/components/CampusMap'
import styles from './MapPage.module.css'

export function MapPage() {
  return (
    <section className={styles.page} aria-label="Mapa del campus">
      <CampusMap />
    </section>
  )
}
