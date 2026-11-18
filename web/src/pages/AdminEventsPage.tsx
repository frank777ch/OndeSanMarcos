import { useEffect } from 'react'
import { Button } from '@/components/Button/Button'
import { EventsTable } from '@/features/admin/events/components/EventsTable'
import { useAdminEventsStore } from '@/features/admin/events/store/useAdminEventsStore'
import { useAdminPlacesStore } from '@/features/admin/places/store/useAdminPlacesStore'

/** Pestaña «Eventos» del área de administración. */
export function AdminEventsPage() {
  const eventsStatus = useAdminEventsStore((s) => s.status)
  const placesStatus = useAdminPlacesStore((s) => s.status)

  const loadAll = (quiet: boolean) => {
    void useAdminEventsStore.getState().load({ quiet })
    void useAdminPlacesStore.getState().load({ quiet })
  }

  useEffect(() => {
    loadAll(useAdminEventsStore.getState().status === 'ready')
  }, [])

  const failed = eventsStatus === 'error' || placesStatus === 'error'
  const ready = eventsStatus === 'ready' && placesStatus === 'ready'

  return (
    <section aria-label="Eventos" className="h-full overflow-y-auto p-8">
      {failed ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="m-0">No pudimos cargar los eventos. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button onClick={() => loadAll(false)}>Reintentar</Button>
        </div>
      ) : ready ? (
        <EventsTable />
      ) : (
        <p role="status" className="m-0 text-muted">Cargando eventos…</p>
      )}
    </section>
  )
}
