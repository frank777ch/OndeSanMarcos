import { Link } from 'react-router-dom'
import styles from './Page.module.css'

export function NotFoundPage() {
  return (
    <section className={styles.page}>
      <h1>Página no encontrada</h1>
      <p className={styles.muted}>La dirección que buscas no existe.</p>
      <Link to="/mapa" className={styles.link}>
        Ir al mapa
      </Link>
    </section>
  )
}
