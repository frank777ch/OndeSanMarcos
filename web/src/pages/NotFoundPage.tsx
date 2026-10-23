import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-3 p-8">
      <h1 className="text-3xl">Página no encontrada</h1>
      <p className="text-muted">La dirección que buscas no existe.</p>
      <Link to="/mapa" className="font-medium text-primary">
        Ir al mapa
      </Link>
    </section>
  )
}
