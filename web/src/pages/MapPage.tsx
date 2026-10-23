import { CampusMap } from '@/features/map/components/CampusMap'

export function MapPage() {
  return (
    <section className="absolute inset-0" aria-label="Mapa del campus">
      <CampusMap />
    </section>
  )
}
