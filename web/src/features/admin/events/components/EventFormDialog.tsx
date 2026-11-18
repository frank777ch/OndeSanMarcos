import { useMemo, useReducer, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { Combobox } from '@/components/Combobox/Combobox'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Switch } from '@/components/Switch/Switch'
import { Textarea } from '@/components/Textarea/Textarea'
import { EVENT_CATEGORY_LABELS, EVENT_MODALITY_LABELS, EVENT_STATUS_LABELS } from '@/features/events/utils/eventTime'
import { parseFieldErrors } from '@/services/api/adminPlacesApi'
import { ApiError } from '@/services/api/client'
import { PlaceImageField } from '../../places/components/PlaceImageField'
import { useAdminPlacesStore } from '../../places/store/useAdminPlacesStore'
import { useAdminEventsStore } from '../store/useAdminEventsStore'
import type { AdminEvent } from '../types'
import { canSubmitEvent, emptyEventForm, endError, eventToForm, formToEventInput, isEventDirty, type EventForm } from '../utils/form'

const FIELD_ORDER: (keyof EventForm)[] = [
  'title', 'startsAt', 'endsAt', 'placeId', 'locationDetail', 'category', 'status', 'modality', 'onlineUrl',
  'organizer', 'audience', 'priceNote', 'registrationUrl', 'registrationNote', 'website', 'email', 'phone',
  'description', 'imageUrl', 'agenda', 'keywords',
]
const fieldId = (name: string) => `event-form-${name}`
const NETWORK_MESSAGE = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'
const REVIEW_MESSAGE = 'Revisa los campos marcados.'

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
      <legend className="mb-3 border-b border-border pb-1 text-base font-medium">{title}</legend>
      {children}
    </fieldset>
  )
}

type Action = { field: keyof EventForm; value: EventForm[keyof EventForm] }
const reducer = (form: EventForm, a: Action): EventForm => ({ ...form, [a.field]: a.value })

interface EventFormDialogProps {
  /** Evento a editar, o `null` para crear uno nuevo. */
  event: AdminEvent | null
  onClose: () => void
}

/** Diálogo para crear o editar un evento. Las fechas se escriben en hora de Lima. */
export function EventFormDialog({ event, onClose }: EventFormDialogProps) {
  const initial = useMemo(() => (event ? eventToForm(event) : emptyEventForm()), [event])
  const [form, dispatch] = useReducer(reducer, initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  const places = useAdminPlacesStore((s) => s.places)
  const save = useAdminEventsStore((s) => s.save)
  const placeOptions = useMemo(
    () => places.map((p) => ({ value: String(p.id), label: p.name, hint: p.shortName ?? undefined })),
    [places],
  )

  const set = <K extends keyof EventForm>(field: K) => (value: EventForm[K]) => {
    dispatch({ field, value })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }
  const text = (field: keyof EventForm) => ({
    id: fieldId(field),
    value: form[field] as string,
    error: errors[field],
    onChange: (e: { target: { value: string } }) => set(field)(e.target.value as never),
  })

  const dirty = isEventDirty(initial, form)
  const requestClose = () => {
    if (saving) return
    if (confirmingDiscard) setConfirmingDiscard(false)
    else if (dirty) setConfirmingDiscard(true)
    else onClose()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving || uploading || !canSubmitEvent(form)) return
    setSaving(true)
    setErrors({})
    setGeneral(null)
    try {
      await save(event?.id ?? null, formToEventInput(form))
      onClose()
    } catch (error) {
      const parsed = parseFieldErrors(error)
      const hasFields = Object.keys(parsed.fields).length > 0
      const validation = error instanceof ApiError && (error.status === 422 || error.status === 409)
      if (validation && (hasFields || parsed.general)) {
        setErrors(parsed.fields)
        setGeneral(parsed.general ?? (hasFields ? REVIEW_MESSAGE : null))
        const first = FIELD_ORDER.find((f) => parsed.fields[f])
        if (first) requestAnimationFrame(() => document.getElementById(fieldId(first))?.focus())
      } else if (!(error instanceof ApiError && error.status === 401)) {
        setGeneral(NETWORK_MESSAGE)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={event ? 'Editar evento' : 'Nuevo evento'} onClose={requestClose} blurBackdrop wide>
      <form onSubmit={submit} noValidate className="relative flex min-h-0 flex-1 flex-col">
        <div inert={confirmingDiscard} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-5">
            {general && (
              <p role="alert" className="m-0 rounded-md border border-danger px-4 py-3 text-danger">
                {general}
              </p>
            )}

            <Section title="Datos">
              {event && (
                <p className="m-0 text-sm text-muted">
                  Id: <code className="rounded-sm bg-surface px-1.5 py-0.5">{event.id}</code>
                  {' · '}
                  Slug: <code className="rounded-sm bg-surface px-1.5 py-0.5">{event.slug}</code>
                </p>
              )}
              <Input label="Título" required maxLength={200} {...text('title')} />
              <Select label="Tipo" value={form.category} options={toOptions(EVENT_CATEGORY_LABELS)} onChange={(v) => set('category')(v as EventForm['category'])} />
              <Input label="Organiza" maxLength={300} {...text('organizer')} />
              <Switch checked={form.isPublished} onChange={set('isPublished')}>
                Publicado (visible en el mapa y para el asistente)
              </Switch>
            </Section>

            <Section title="Fecha y hora (hora de Lima)">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Inicio" type="datetime-local" required {...text('startsAt')} />
                <Input label="Fin" type="datetime-local" {...text('endsAt')} error={errors.endsAt || endError(form)} />
              </div>
              <p className="m-0 text-sm text-muted">Sin fin, el evento se considera terminado al acabar el día de inicio.</p>
              <Select label="Estado" value={form.status} options={toOptions(EVENT_STATUS_LABELS)} onChange={(v) => set('status')(v as EventForm['status'])} />
              {form.status !== 'scheduled' && <Input label="Nota del estado" placeholder="Nueva fecha, motivo…" maxLength={300} {...text('statusNote')} />}
            </Section>

            <Section title="Lugar">
              <Select label="Modalidad" value={form.modality} options={toOptions(EVENT_MODALITY_LABELS)} onChange={(v) => set('modality')(v as EventForm['modality'])} />
              <Combobox
                id={fieldId('placeId')}
                label="Lugar"
                clearable
                options={placeOptions}
                value={form.placeId === null ? null : String(form.placeId)}
                error={errors.placeId}
                onChange={(v) => set('placeId')(v === null ? null : Number(v))}
                placeholder="Sin lugar (virtual o por definir)"
              />
              <Input label="Sala o referencia" placeholder="Aula 203, 2.º piso" maxLength={300} {...text('locationDetail')} />
              {form.modality !== 'in_person' && <Input label="Enlace para verlo en línea" inputMode="url" placeholder="https://" maxLength={500} {...text('onlineUrl')} />}
            </Section>

            <Section title="Costo e inscripción">
              <Select
                label="Costo"
                value={form.isFree}
                options={[{ value: '', label: 'Sin indicar' }, { value: 'yes', label: 'Gratis' }, { value: 'no', label: 'Con costo' }]}
                onChange={(v) => set('isFree')(v as EventForm['isFree'])}
              />
              <Input label="Detalle del costo" placeholder="S/ 10 estudiantes" maxLength={300} {...text('priceNote')} />
              <Input label="Dirigido a" placeholder="Abierto al público" maxLength={300} {...text('audience')} />
              <Input label="Enlace de inscripción" inputMode="url" placeholder="https://" maxLength={500} {...text('registrationUrl')} />
              <Input label="Condiciones de inscripción" maxLength={300} {...text('registrationNote')} />
            </Section>

            <Section title="Contacto">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" maxLength={300} {...text('phone')} />
                <Input label="Correo" type="email" maxLength={300} {...text('email')} />
              </div>
              <Input label="Página web" inputMode="url" placeholder="https://" maxLength={300} {...text('website')} />
            </Section>

            <Section title="Descripción">
              <Textarea label="Descripción" rows={4} maxLength={5000} {...text('description')} />
              <PlaceImageField
                id={fieldId('imageUrl')}
                label="Imagen del evento"
                value={form.imageUrl}
                error={errors.imageUrl}
                onChange={set('imageUrl')}
                onBusyChange={setUploading}
              />
            </Section>

            <Section title="Listas">
              <Textarea label="Programa" hint="Un tramo por línea." rows={3} {...text('agenda')} />
              <Textarea label="Palabras clave" hint="Una por línea." rows={3} {...text('keywords')} />
            </Section>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmitEvent(form) || saving || uploading} aria-busy={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>

        {confirmingDiscard && (
          <div role="alertdialog" aria-labelledby="discard-title" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg/95 p-6 text-center">
            <h3 id="discard-title" className="m-0 text-lg">¿Descartar los cambios?</h3>
            <p className="m-0 text-muted">Lo que escribiste no se ha guardado.</p>
            <div className="flex gap-3">
              <Button autoFocus variant="secondary" onClick={() => setConfirmingDiscard(false)}>Seguir editando</Button>
              <Button onClick={onClose}>Descartar</Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
