import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { IconButton } from '@/components/IconButton/IconButton'
import { useToastStore } from '@/components/Toast/toastStore'
import { parseFieldErrors } from '@/services/api/adminPlacesApi'
import { ApiError } from '@/services/api/client'
import type { AdminCategory } from '../../places/types'
import { useAdminCategoriesStore } from '../store/useAdminCategoriesStore'
import { CategoryFormDialog } from './CategoryFormDialog'

const placesText = (n: number) => `${n} ${n === 1 ? 'lugar' : 'lugares'}`

/** Tabla de categorías con sus acciones (RF-31.28 a RF-31.31). */
export function CategoriesTable() {
  const categories = useAdminCategoriesStore((s) => s.categories)
  const [editing, setEditing] = useState<AdminCategory | 'new' | null>(null)
  const [deleting, setDeleting] = useState<AdminCategory | null>(null)

  const confirmDelete = async () => {
    const target = deleting
    setDeleting(null)
    if (!target) return
    try {
      await useAdminCategoriesStore.getState().remove(target.id)
    } catch (error) {
      // Si otro cambio le puso lugares mientras tanto, el servidor responde 409: se muestra el motivo.
      const reason = parseFieldErrors(error).general
      useToastStore
        .getState()
        .show(
          error instanceof ApiError && error.status === 409 && reason
            ? reason
            : 'No se pudo borrar la categoría. Inténtalo de nuevo.',
          'error',
        )
      if (error instanceof ApiError && error.status === 409) void useAdminCategoriesStore.getState().load({ quiet: true })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl">Categorías</h1>
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => setEditing('new')}>
          Nueva categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-8 text-center">
          <p className="m-0">Todavía no hay categorías.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Categorías de lugares</caption>
            <thead className="bg-surface text-sm">
              <tr>
                <th scope="col" className="px-4 py-3">Color</th>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Slug</th>
                <th scope="col" className="px-4 py-3">Orden</th>
                <th scope="col" className="px-4 py-3">Lugares</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <span
                      role="img"
                      aria-label={`Color ${c.color}`}
                      className="block size-5 rounded-full border border-border"
                      style={{ backgroundColor: c.color }}
                    />
                  </td>
                  <th scope="row" className="px-4 py-3 font-medium">{c.label}</th>
                  <td className="px-4 py-3"><code>{c.slug}</code></td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">{placesText(c.placesCount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <IconButton label={`Editar ${c.label}`} onClick={() => setEditing(c)}>
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        label={
                          c.placesCount > 0
                            ? `Borrar ${c.label} (tiene ${placesText(c.placesCount)})`
                            : `Borrar ${c.label}`
                        }
                        disabled={c.placesCount > 0}
                        onClick={() => setDeleting(c)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CategoryFormDialog category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="¿Borrar esta categoría?"
        message={`Se borrará la categoría «${deleting?.label ?? ''}». No tiene ningún lugar. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
