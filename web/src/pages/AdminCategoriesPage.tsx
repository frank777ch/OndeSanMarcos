import { useEffect } from 'react'
import { Button } from '@/components/Button/Button'
import { CategoriesTable } from '@/features/admin/categories/components/CategoriesTable'
import { useAdminCategoriesStore } from '@/features/admin/categories/store/useAdminCategoriesStore'

/** Pestaña «Categorías» del área de administración (HU-31). */
export function AdminCategoriesPage() {
  const status = useAdminCategoriesStore((s) => s.status)

  useEffect(() => {
    void useAdminCategoriesStore.getState().load({ quiet: useAdminCategoriesStore.getState().status === 'ready' })
  }, [])

  return (
    <section aria-label="Categorías" className="h-full overflow-y-auto p-8">
      {status === 'error' ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="m-0">No pudimos cargar las categorías. Revisa tu conexión e inténtalo de nuevo.</p>
          <Button onClick={() => void useAdminCategoriesStore.getState().load()}>Reintentar</Button>
        </div>
      ) : status === 'ready' ? (
        <CategoriesTable />
      ) : (
        <p role="status" className="m-0 text-muted">
          Cargando categorías…
        </p>
      )}
    </section>
  )
}
