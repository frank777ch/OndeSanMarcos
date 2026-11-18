import { useMemo, useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { IconButton } from '@/components/IconButton/IconButton'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { useToastStore } from '@/components/Toast/toastStore'
import { EVENT_STATUS_LABELS, formatEventWhen } from '@/features/events/utils/eventTime'
import { ApiError } from '@/services/api/client'
import { useAdminPlacesStore } from '../../places/store/useAdminPlacesStore'
import { useAdminEventsStore } from '../store/useAdminEventsStore'
import type { AdminEvent } from '../types'
import { EventFormDialog } from './EventFormDialog'

type When = 'all' | 'upcoming' | 'past'

function RagWarning() {
  const warning = useAdminEventsStore((s) => s.ragWarning)
  const retry = useAdminEventsStore((s) => s.retryReindex)
  const dismiss = useAdminEventsStore((s) => s.dismissRagWarning)
  if (!warning) return null
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-md border border-danger px-4 py-3">
      <p className="m-0">El evento «{warning.title}» se guardó, pero el asistente aún no lo conoce.</p>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => void retry()}>Reintentar</Button>
        <IconButton label="Cerrar aviso" onClick={dismiss}><X size={16} /></IconButton>
      </div>
    </div>
  )
}

const endOf = (e: AdminEvent) => Date.parse(e.endsAt ?? e.startsAt)

/** Lista de eventos con búsqueda, filtro por momento y acciones por fila. */
export function EventsTable() {
  const events = useAdminEventsStore((s) => s.events)
  const busy = useAdminEventsStore((s) => s.busy)
  const places = useAdminPlacesStore((s) => s.places)
  const [q, setQ] = useState('')
  const [when, setWhen] = useState<When>('all')
  const [editing, setEditing] = useState<AdminEvent | 'new' | null>(null)
  const [unpublishing, setUnpublishing] = useState<AdminEvent | null>(null)
  const [deleting, setDeleting] = useState<AdminEvent | null>(null)

  const placeName = useMemo(() => new Map(places.map((p) => [p.id, p.name])), [places])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    // eslint-disable-next-line react-hooks/purity -- instante de filtrado, solo al recalcular la lista
    const now = Date.now()
    return events.filter((e) => {
      if (needle && ![e.title, e.organizer ?? '', e.slug, ...e.keywords].some((t) => t.toLowerCase().includes(needle))) return false
      // Sin fin, se acepta el día de inicio completo: un margen de 24 h evita mostrarlo como pasado a media jornada.
      const past = (e.endsAt ? endOf(e) : endOf(e) + 86_400_000) < now
      return when === 'all' || (when === 'past') === past
    })
  }, [events, q, when])

  const confirmDelete = async () => {
    const target = deleting
    setDeleting(null)
    if (!target) return
    try {
      await useAdminEventsStore.getState().remove(target)
    } catch (error) {
      useToastStore.getState().show('No se pudo borrar el evento. Inténtalo de nuevo.', 'error')
      if (error instanceof ApiError && error.status === 404) void useAdminEventsStore.getState().load({ quiet: true })
    }
  }

  const { togglePublished } = useAdminEventsStore.getState()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl">Eventos</h1>
        <Button icon={<Plus size={18} aria-hidden="true" />} onClick={() => setEditing('new')}>Nuevo evento</Button>
      </div>
      <RagWarning />
      <div className="grid grid-cols-[minmax(12rem,2fr)_minmax(10rem,1fr)] items-end gap-4">
        <Input label="Buscar" type="search" placeholder="Título, organizador o palabra clave" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select
          label="Cuándo"
          value={when}
          options={[{ value: 'all', label: 'Todos' }, { value: 'upcoming', label: 'Próximos' }, { value: 'past', label: 'Pasados' }]}
          onChange={(v) => setWhen(v as When)}
        />
      </div>
      <p aria-live="polite" className="m-0 text-sm text-muted">{filtered.length} de {events.length} eventos</p>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-8 text-center">
          <p className="m-0">Todavía no hay eventos.</p>
          <Button onClick={() => setEditing('new')}>Nuevo evento</Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="m-0 rounded-md border border-border p-8 text-center">No hay eventos con esos filtros</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Eventos del campus</caption>
            <thead className="bg-surface text-sm">
              <tr>
                <th scope="col" className="px-4 py-3">Evento</th>
                <th scope="col" className="px-4 py-3">Cuándo</th>
                <th scope="col" className="px-4 py-3">Lugar</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const isBusy = Boolean(busy[e.id])
                return (
                  <tr key={e.id} className="border-t border-border align-middle">
                    <th scope="row" className="px-4 py-3 font-medium">
                      {e.title}
                      {e.organizer && <span className="block text-sm font-normal text-muted">{e.organizer}</span>}
                    </th>
                    <td className="px-4 py-3 text-sm">{formatEventWhen({ startsAt: new Date(e.startsAt), endsAt: e.endsAt ? new Date(e.endsAt) : undefined })}</td>
                    <td className="px-4 py-3 text-sm">{e.placeId ? (placeName.get(e.placeId) ?? e.placeId) : '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {e.isPublished ? 'Publicado' : 'Oculto'}
                      {e.status !== 'scheduled' && <span className="block text-muted">{EVENT_STATUS_LABELS[e.status]}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <IconButton label={`Editar ${e.title}`} disabled={isBusy} onClick={() => setEditing(e)}><Pencil size={16} /></IconButton>
                        <IconButton
                          label={`${e.isPublished ? 'Despublicar' : 'Publicar'} ${e.title}`}
                          disabled={isBusy}
                          onClick={() => (e.isPublished ? setUnpublishing(e) : void togglePublished(e))}
                        >
                          {e.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                        <IconButton label={`Borrar ${e.title}`} disabled={isBusy} onClick={() => setDeleting(e)}><Trash2 size={16} /></IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <EventFormDialog event={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={unpublishing !== null}
        title="¿Despublicar este evento?"
        message={`«${unpublishing?.title ?? ''}» dejará de verse en el mapa y en el asistente. Puedes volver a publicarlo cuando quieras.`}
        confirmLabel="Despublicar"
        onCancel={() => setUnpublishing(null)}
        onConfirm={() => {
          if (unpublishing) void togglePublished(unpublishing)
          setUnpublishing(null)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="¿Borrar este evento?"
        message={`Se borrará «${deleting?.title ?? ''}» del mapa y del asistente. Esta acción no se puede deshacer; si solo quieres ocultarlo, despublícalo.`}
        confirmLabel="Borrar"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
