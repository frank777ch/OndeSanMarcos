import { useMemo } from 'react'
import { create } from 'zustand'
import { fetchUpcomingEvents } from '@/services/api/eventsApi'
import type { CampusEvent } from '../types'
import { isUpcoming } from '../utils/eventTime'

export type EventsStatus = 'idle' | 'loading' | 'ready' | 'error'

interface EventsState {
  status: EventsStatus
  /** Eventos próximos que dio la API, por fecha. Vacío hasta `ready`. */
  events: CampusEvent[]
  /**
   * Pide los eventos una sola vez. Un fallo no muestra nada al usuario: el mapa sigue sin el botón
   * de eventos (los lugares no dependen de ellos). Tras un error vuelve a pedir si se llama otra vez.
   */
  load: () => Promise<void>
  /** Vuelve a pedirlos aunque ya estén cargados (tras un cambio del administrador). Si falla, conserva lo que había. */
  refresh: () => Promise<void>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  status: 'idle',
  events: [],
  load: async () => {
    const { status } = get()
    if (status === 'loading' || status === 'ready') return
    set({ status: 'loading' })
    try {
      set({ status: 'ready', events: await fetchUpcomingEvents() })
    } catch {
      set({ status: 'error', events: [] })
    }
  },
  refresh: async () => {
    try {
      set({ status: 'ready', events: await fetchUpcomingEvents({ fresh: true }) })
    } catch {
      // Se queda con los datos anteriores.
    }
  },
}))

/** Eventos que aún no terminaron, y de ellos los que tienen lugar (los únicos que se pueden dibujar en el mapa). */
export function selectUpcoming(events: CampusEvent[], now: number = Date.now()): CampusEvent[] {
  return events.filter((e) => isUpcoming(e, now))
}

/** Eventos próximos agrupados por el id del lugar donde ocurren. Los virtuales (sin lugar) no salen. */
export function groupByPlace(events: CampusEvent[]): Map<number, CampusEvent[]> {
  const byPlace = new Map<number, CampusEvent[]>()
  for (const event of events) {
    if (event.placeId === undefined) continue
    byPlace.set(event.placeId, [...(byPlace.get(event.placeId) ?? []), event])
  }
  return byPlace
}

/** Eventos próximos (que aún no terminaron) para pintar en pantalla. */
export function useUpcomingEvents(): CampusEvent[] {
  const events = useEventsStore((s) => s.events)
  return useMemo(() => selectUpcoming(events), [events])
}
