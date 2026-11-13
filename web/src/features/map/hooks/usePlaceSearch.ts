import { useEffect, useMemo, useState } from 'react'
import { searchPlacesApi } from '@/services/api/placesApi'
import { usePlacesStore } from '../store/usePlacesStore'
import type { Place } from '../types'
import { MIN_QUERY_LENGTH, normalizeText, searchPlaces } from '../utils/search'

/** Pausa sin escribir antes de pedir la búsqueda al servidor (RF-36.14). */
export const SEARCH_DEBOUNCE_MS = 200

interface Settled {
  /** Consulta a la que corresponde la respuesta. */
  query: string
  /** Lugares del servidor, o `null` si la petición falló (se queda la lista local). */
  places: Place[] | null
}

/**
 * Resultados del buscador de lugares (HU-36). Devuelve de inmediato los de la búsqueda local; tras una
 * pausa pide los del servidor (tolera errores de escritura) y, cuando llega la respuesta de la misma
 * consulta, los usa en su lugar. Si el servidor falla, se queda con los locales sin mostrar error.
 * `pending` indica que la respuesta del servidor aún no llegó (para no anunciar «sin resultados» antes).
 */
export function usePlaceSearch(query: string): { results: Place[]; pending: boolean } {
  const places = usePlacesStore((s) => s.places)
  const local = useMemo(() => searchPlaces(places, query), [places, query])
  const text = query.trim()
  const active = normalizeText(query).length >= MIN_QUERY_LENGTH
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchPlacesApi(text, controller.signal)
        .then((found) => {
          if (controller.signal.aborted) return
          // Un lugar que el mapa aún no conoce (recién creado) se agrega para poder elegirlo.
          usePlacesStore.getState().addMissing(found)
          setSettled({ query: text, places: found })
        })
        .catch(() => {
          // Sin conexión o error del servidor: se conserva la lista local (RF-36.16).
          if (!controller.signal.aborted) setSettled({ query: text, places: null })
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [active, text])

  const answered = active && settled?.query === text
  return {
    results: answered && settled.places ? settled.places : local,
    pending: active && !answered,
  }
}
