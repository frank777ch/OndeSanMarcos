import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import type { LocationResult } from '../types'
import { PlaceLinkCard } from './PlaceLinkCard'

interface AssistantMessageProps {
  text: string
  places: LocationResult[]
}

export function AssistantMessage({ text, places }: AssistantMessageProps) {
  // Un lugar que el mapa no conoce no tiene a dónde llevar (RF-05.18). Se filtra al mostrar, no al
  // recibir la respuesta: si los lugares terminan de cargar después, la tarjeta aparece (RF-28.14).
  const known = usePlacesStore((s) => s.bySlug)
  const visible = places.filter((place) => place.id in known)
  return (
    <div className="flex flex-col gap-3">
      <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</p>
      {visible.length > 0 && (
        <ul className="flex flex-col gap-2">
          {visible.map((place) => (
            <li key={place.id}>
              <PlaceLinkCard place={place} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
