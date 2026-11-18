import { create } from 'zustand'
import { useToastStore } from '@/components/Toast/toastStore'
import { useEventsStore } from '@/features/events/store/useEventsStore'
import { deleteAdminEvent, eventToInput, listAdminEvents, reindexAdminEvent, saveAdminEvent } from '@/services/api/adminEventsApi'
import type { AdminStatus } from '../../categories/store/useAdminCategoriesStore'
import { toLimaInput } from '../utils/form'
import type { AdminEvent, AdminEventInput, SavedEvent } from '../types'

interface AdminEventsState {
  status: AdminStatus
  events: AdminEvent[]
  busy: Record<number, true>
  ragWarning: { eventId: number; title: string } | null
  load: (options?: { quiet?: boolean }) => Promise<void>
  save: (id: number | null, input: AdminEventInput) => Promise<SavedEvent>
  togglePublished: (event: AdminEvent) => Promise<boolean>
  remove: (event: AdminEvent) => Promise<void>
  retryReindex: () => Promise<void>
  dismissRagWarning: () => void
}

/** Más recientes primero, como la API. */
const byDate = (a: AdminEvent, b: AdminEvent) => b.startsAt.localeCompare(a.startsAt) || b.id - a.id
const toast = (message: string, kind: 'success' | 'error' = 'success') => useToastStore.getState().show(message, kind)

export const useAdminEventsStore = create<AdminEventsState>((set, get) => {
  const apply = ({ event, ragSync }: SavedEvent) => {
    set((s) => ({
      events: [...s.events.filter((e) => e.id !== event.id), event].sort(byDate),
      ragWarning:
        ragSync === 'failed'
          ? { eventId: event.id, title: event.title }
          : s.ragWarning?.eventId === event.id
            ? null
            : s.ragWarning,
    }))
    // El mapa público se actualiza sin recargar.
    void useEventsStore.getState().refresh()
  }

  return {
    status: 'idle',
    events: [],
    busy: {},
    ragWarning: null,
    load: async ({ quiet = false } = {}) => {
      if (!quiet) set({ status: 'loading' })
      try {
        set({ events: (await listAdminEvents()).sort(byDate), status: 'ready' })
      } catch {
        if (!quiet || get().status !== 'ready') set({ status: 'error' })
      }
    },
    save: async (id, input) => {
      const saved = await saveAdminEvent(id, input)
      apply(saved)
      toast('Evento guardado')
      return saved
    },
    togglePublished: async (event) => {
      if (get().busy[event.id]) return false
      set((s) => ({ busy: { ...s.busy, [event.id]: true } }))
      try {
        const input = eventToInput(event, {
          isPublished: !event.isPublished,
          startsAt: `${toLimaInput(event.startsAt)}:00`,
          endsAt: event.endsAt ? `${toLimaInput(event.endsAt)}:00` : null,
        })
        apply(await saveAdminEvent(event.id, input))
        toast(event.isPublished ? 'Evento despublicado' : 'Evento publicado')
        return true
      } catch {
        toast('No se pudo guardar el cambio. Inténtalo de nuevo.', 'error')
        return false
      } finally {
        set((s) => {
          const { [event.id]: _removed, ...rest } = s.busy
          return { busy: rest }
        })
      }
    },
    remove: async (event) => {
      if (get().busy[event.id]) return
      set((s) => ({ busy: { ...s.busy, [event.id]: true } }))
      try {
        const ragSync = await deleteAdminEvent(event.id)
        set((s) => ({
          events: s.events.filter((e) => e.id !== event.id),
          ragWarning: s.ragWarning?.eventId === event.id ? null : s.ragWarning,
        }))
        toast(
          ragSync === 'failed' ? 'Evento borrado, pero el asistente todavía lo recuerda.' : 'Evento borrado',
          ragSync === 'failed' ? 'error' : 'success',
        )
        void useEventsStore.getState().refresh()
      } finally {
        set((s) => {
          const { [event.id]: _removed, ...rest } = s.busy
          return { busy: rest }
        })
      }
    },
    retryReindex: async () => {
      const warning = get().ragWarning
      if (!warning) return
      try {
        const saved = await reindexAdminEvent(warning.eventId)
        if (saved.ragSync === 'failed') {
          toast('El asistente todavía no pudo actualizarse. Inténtalo de nuevo.', 'error')
          return
        }
        set({ ragWarning: null })
        toast('El asistente ya conoce el evento')
      } catch {
        toast('No se pudo contactar con el servidor. Inténtalo de nuevo.', 'error')
      }
    },
    dismissRagWarning: () => set({ ragWarning: null }),
  }
})
