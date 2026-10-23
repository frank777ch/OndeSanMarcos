import type { LocationResult } from '../types'
import { PlaceLinkCard } from './PlaceLinkCard'

interface AssistantMessageProps {
  text: string
  places: LocationResult[]
}

export function AssistantMessage({ text, places }: AssistantMessageProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</p>
      {places.length > 0 && (
        <ul className="flex flex-col gap-2">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceLinkCard place={place} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
