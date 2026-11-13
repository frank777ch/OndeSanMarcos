import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { Combobox } from '@/components/Combobox/Combobox'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Input } from '@/components/Input/Input'
import { Pagination } from '@/components/Pagination/Pagination'
import { Select } from '@/components/Select/Select'
import { useAdminCategoriesStore } from '../../categories/store/useAdminCategoriesStore'
import { useAdminPlacesStore } from '../store/useAdminPlacesStore'
import type { AdminPlace } from '../types'
import {
  PAGE_SIZE,
  clampPage,
  filterPlaces,
  hasActiveFilters,
  paginate,
  type TriState,
} from '../utils/filters'
import { PlaceFormDialog } from './PlaceFormDialog'
import { PlaceRowActions } from './PlaceRowActions'
import { RagWarning } from './RagWarning'

const formatDate = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TriStateSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: TriState
  options: [string, string, string]
  onChange: (value: TriState) => void
}) {
  return (
    <Select
      label={label}
      value={value}
      options={[
        { value: 'all', label: options[0] },
        { value: 'yes', label: options[1] },
        { value: 'no', label: options[2] },
      ]}
      onChange={(v) => onChange(v as TriState)}
    />
  )
}

/** Lista de lugares con búsqueda, filtros, paginación y acciones por fila (RF-31.2 a RF-31.10). */
export function PlacesTable() {
  const places = useAdminPlacesStore((s) => s.places)
  const filters = useAdminPlacesStore((s) => s.filters)
  const page = useAdminPlacesStore((s) => s.page)
  const busy = useAdminPlacesStore((s) => s.busy)
  const { setFilters, resetFilters, setPage, togglePublished, toggleVerified } = useAdminPlacesStore.getState()
  const categories = useAdminCategoriesStore((s) => s.categories)

  const [editing, setEditing] = useState<AdminPlace | 'new' | null>(null)
  const [unpublishing, setUnpublishing] = useState<AdminPlace | null>(null)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const categoryOptions = useMemo(() => categories.map((c) => ({ value: String(c.id), label: c.label })), [categories])
  const filtered = useMemo(() => filterPlaces(places, filters), [places, filters])
  const current = clampPage(page, filtered.length)
  const rows = useMemo(() => paginate(filtered, current), [filtered, current])

  const onTogglePublished = (place: AdminPlace) => {
    // Despublicar afecta a todos los visitantes: pide confirmar; publicar no (RF-31.7).
    if (place.isPublished) setUnpublishing(place)
    else void togglePublished(place)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl">Lugares</h1>
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => setEditing('new')}>
          Nuevo lugar
        </Button>
      </div>

      <RagWarning />

      <div className="grid grid-cols-[minmax(12rem,2fr)_minmax(10rem,1fr)_auto_auto] items-end gap-4">
        <Input
          label="Buscar"
          type="search"
          placeholder="Nombre, sigla, palabra clave o id"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value })}
        />
        <Combobox
          label="Categoría"
          clearable
          placeholder="Todas"
          options={categoryOptions}
          value={filters.categoryId === null ? null : String(filters.categoryId)}
          onChange={(categoryId) => setFilters({ categoryId: categoryId === null ? null : Number(categoryId) })}
        />
        <TriStateSelect
          label="Estado"
          value={filters.published}
          options={['Todos', 'Publicados', 'Ocultos']}
          onChange={(published) => setFilters({ published })}
        />
        <TriStateSelect
          label="Verificación"
          value={filters.verified}
          options={['Todos', 'Verificados', 'Sin verificar']}
          onChange={(verified) => setFilters({ verified })}
        />
      </div>

      <p aria-live="polite" className="m-0 text-sm text-muted">
        {filtered.length} de {places.length} lugares
      </p>

      {places.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-8 text-center">
          <p className="m-0">Todavía no hay lugares.</p>
          <Button onClick={() => setEditing('new')}>Nuevo lugar</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-8 text-center">
          <p className="m-0">No hay lugares con esos filtros</p>
          {hasActiveFilters(filters) && (
            <Button variant="secondary" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Lugares del campus</caption>
            <thead className="bg-surface text-sm">
              <tr>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Verificación</th>
                <th scope="col" className="px-4 py-3">Última modificación</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((place) => {
                const category = categoryById.get(place.categoryId)
                return (
                  <tr key={place.id} className="border-t border-border align-middle">
                    <th scope="row" className="px-4 py-3 font-medium">
                      {place.name}
                      {place.shortName && (
                        <span className="block text-sm font-normal text-muted">{place.shortName}</span>
                      )}
                    </th>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-3 rounded-full"
                          style={{ backgroundColor: category?.color ?? '#757575' }}
                        />
                        {category?.label ?? place.categoryId}
                      </span>
                    </td>
                    <td className="px-4 py-3">{place.isPublished ? 'Publicado' : 'Oculto'}</td>
                    <td className="px-4 py-3">{place.verifiedAt ? 'Verificado' : 'Sin verificar'}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(place.updatedAt)}
                      {place.updatedBy && <span className="block text-muted">{place.updatedBy}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <PlaceRowActions
                        place={place}
                        busy={Boolean(busy[place.id])}
                        onEdit={setEditing}
                        onTogglePublished={onTogglePublished}
                        onToggleVerified={(p) => void toggleVerified(p)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={current} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      {editing && (
        <PlaceFormDialog place={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDialog
        open={unpublishing !== null}
        title="¿Despublicar este lugar?"
        message={`«${unpublishing?.name ?? ''}» dejará de verse en el mapa y en el asistente. Puedes volver a publicarlo cuando quieras.`}
        confirmLabel="Despublicar"
        onCancel={() => setUnpublishing(null)}
        onConfirm={() => {
          if (unpublishing) void togglePublished(unpublishing)
          setUnpublishing(null)
        }}
      />
    </div>
  )
}
