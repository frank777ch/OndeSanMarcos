import type { Place } from '../data/places'

export const MIN_QUERY_LENGTH = 2
export const MAX_RESULTS = 8

/** Minúsculas, sin tildes y sin espacios sobrantes en los extremos. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Busca lugares por nombre o palabra clave. Orden: palabra clave exacta (una
 * sigla), el nombre empieza con el texto, el nombre lo contiene, y al final
 * una palabra clave lo contiene.
 */
export function searchPlaces(
  places: Place[],
  query: string,
  limit: number = MAX_RESULTS,
): Place[] {
  const q = normalizeText(query)
  if (q.length < MIN_QUERY_LENGTH) return []

  const ranked: { place: Place; rank: number }[] = []
  for (const place of places) {
    const name = normalizeText(place.name)
    const keywords = place.keywords.map(normalizeText)
    let rank: number | null = null
    if (keywords.includes(q)) rank = 0
    else if (name.startsWith(q)) rank = 1
    else if (name.includes(q)) rank = 2
    else if (keywords.some((k) => k.includes(q))) rank = 3
    if (rank !== null) ranked.push({ place, rank })
  }

  // Array.prototype.sort es estable: dentro de un mismo rango se conserva el orden original.
  ranked.sort((a, b) => a.rank - b.rank)
  return ranked.slice(0, limit).map((r) => r.place)
}
