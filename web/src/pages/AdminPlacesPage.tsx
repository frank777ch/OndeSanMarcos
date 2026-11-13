import { useEffect } from 'react'
import { Button } from '@/components/Button/Button'
import { useAdminCategoriesStore } from '@/features/admin/categories/store/useAdminCategoriesStore'
import { PlacesTable } from '@/features/admin/places/components/PlacesTable'
import { useAdminPlacesStore } from '@/features/admin/places/store/useAdminPlacesStore'

/** Pestaña «Lugares» del área de administración (HU-31). */
export function AdminPlacesPage() {
  const placesStatus = useAdminPlacesStore((s) => s.status)
  const categoriesStatus = useAdminCategoriesStore((s) => s.status)

  const loadAll = (quiet: boolean) => {
    void useAdminPlacesStore.getState().load({ quiet })
    void useAdminCategoriesStore.getState().load({ quiet })
  }

  // Cada visita pide datos frescos; si ya había una tabla, se refresca sin parpadeo.
  useEffect(() => {
    loadAll(useAdminPlacesStore.getState().status === 'ready')
  }, [])

  const failed = placesStatus === 'error' || categoriesStatus === 'error'
  const ready = placesStatus === 'ready' && categoriesStatus === 'ready'

  return (
    <section aria-label="Lugares" className="h-full overflow-y-auto p-8">
      {failed ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="m-0">No pudimos cargar los lugares. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button onClick={() => loadAll(false)}>Reintentar</Button>
        </div>
      ) : ready ? (
        <PlacesTable />
      ) : (
        <p role="status" className="m-0 text-muted">
          Cargando lugares…
        </p>
      )}
    </section>
  )
}
