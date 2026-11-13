import { Suspense, lazy, useMemo, useReducer, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { Combobox } from '@/components/Combobox/Combobox'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Switch } from '@/components/Switch/Switch'
import { Textarea } from '@/components/Textarea/Textarea'
import { ApiError } from '@/services/api/client'
import { parseFieldErrors } from '@/services/api/adminPlacesApi'
import { useAdminCategoriesStore } from '../../categories/store/useAdminCategoriesStore'
import { useAdminPlacesStore } from '../store/useAdminPlacesStore'
import type { AdminPlace } from '../types'
import { inPlaceArea } from '../utils/bounds'
import {
  canSubmit,
  coordinateErrors,
  descendantIds,
  emptyForm,
  formToInput,
  isDirty,
  placeToForm,
  type PlaceForm,
} from '../utils/form'

// El mapa pesa mucho (mapbox-gl): se descarga solo al abrir el formulario por primera vez.
const LocationPicker = lazy(() =>
  import('./LocationPicker').then((m) => ({ default: m.LocationPicker })),
)

interface PlaceFormDialogProps {
  /** Lugar a editar, o `null` para crear uno nuevo. */
  place: AdminPlace | null
  onClose: () => void
}

/** Orden de los campos: el foco va al primero con error (RF-31.17). */
const FIELD_ORDER: (keyof PlaceForm)[] = [
  'name', 'shortName', 'categoryId', 'lat', 'lng', 'schedule', 'detailedSchedule', 'phone', 'annex',
  'email', 'website', 'description', 'accessHint', 'usage', 'keywords', 'careers', 'services',
  'parentPlaceId',
]

const fieldId = (name: string) => `place-form-${name}`

const NETWORK_MESSAGE = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'
const REVIEW_MESSAGE = 'Revisa los campos marcados.'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
      <legend className="mb-3 border-b border-border pb-1 text-base font-medium">{title}</legend>
      {children}
    </fieldset>
  )
}

type Action = { type: 'set'; field: keyof PlaceForm; value: string | boolean | null } | { type: 'coords'; lat: string; lng: string }

function reducer(form: PlaceForm, action: Action): PlaceForm {
  if (action.type === 'coords') return { ...form, lat: action.lat, lng: action.lng }
  return { ...form, [action.field]: action.value }
}

const toText = (n: number) => String(Number(n.toFixed(6)))

/** Diálogo para crear o editar un lugar (RF-31.11 a RF-31.20). */
export function PlaceFormDialog({ place, onClose }: PlaceFormDialogProps) {
  const initial = useMemo(() => (place ? placeToForm(place) : emptyForm()), [place])
  const [form, dispatch] = useReducer(reducer, initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  const categories = useAdminCategoriesStore((s) => s.categories)
  const places = useAdminPlacesStore((s) => s.places)
  const save = useAdminPlacesStore((s) => s.save)

  const categoryOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.label })), [categories])
  const parentOptions = useMemo(() => {
    const excluded = place ? descendantIds(places, place.id) : new Set<string>()
    return places
      .filter((p) => !excluded.has(p.id))
      .map((p) => ({ value: p.id, label: p.name, hint: p.shortName ?? undefined }))
  }, [places, place])
  const contextPlaces = useMemo(() => places.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng })), [places])

  const set = (field: keyof PlaceForm) => (value: string | boolean | null) =>
    dispatch({ type: 'set', field, value })
  const text = (field: keyof PlaceForm) => ({
    id: fieldId(field),
    value: form[field] as string,
    error: errors[field],
    onChange: (e: { target: { value: string } }) => {
      set(field)(e.target.value)
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    },
  })

  const dirty = isDirty(initial, form)
  const coordErrors = coordinateErrors(form)
  const lat = form.lat.trim() === '' ? NaN : Number(form.lat)
  const lng = form.lng.trim() === '' ? NaN : Number(form.lng)
  const markerPoint = inPlaceArea(lat, lng) ? { lat, lng } : { lat: null, lng: null }

  const requestClose = () => {
    if (saving) return
    // Con la pregunta abierta, cerrar (X o Esc) equivale a «Seguir editando».
    if (confirmingDiscard) setConfirmingDiscard(false)
    else if (dirty) setConfirmingDiscard(true)
    else onClose()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving || !canSubmit(form)) return
    setSaving(true)
    setErrors({})
    setGeneral(null)
    try {
      await save(place?.id ?? null, formToInput(form))
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
        // Un 401 ya cerró la sesión; cualquier otro fallo (red, 5xx) deja el diálogo como estaba.
        setGeneral(NETWORK_MESSAGE)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={place ? 'Editar lugar' : 'Nuevo lugar'} onClose={requestClose} blurBackdrop wide>
      <form onSubmit={submit} noValidate className="relative flex min-h-0 flex-1 flex-col">
        <div inert={confirmingDiscard} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-5">
            {general && (
              <p role="alert" className="m-0 rounded-md border border-danger px-4 py-3 text-danger">
                {general}
              </p>
            )}

            <Section title="Datos">
              {place && (
                <p className="m-0 text-sm text-muted">
                  Id: <code className="rounded-sm bg-surface px-1.5 py-0.5">{place.id}</code>
                </p>
              )}
              <Input label="Nombre" required maxLength={200} {...text('name')} />
              <Input label="Nombre corto o sigla" maxLength={300} {...text('shortName')} />
              <Combobox
                id={fieldId('categoryId')}
                label="Categoría"
                required
                options={categoryOptions}
                value={form.categoryId}
                error={errors.categoryId}
                onChange={set('categoryId')}
              />
              <Switch checked={form.isPublished} onChange={set('isPublished')}>
                Publicado (visible en el mapa y para el asistente)
              </Switch>
              <Switch checked={form.verified} onChange={set('verified')}>
                Verificado (dato confirmado con la universidad)
              </Switch>
            </Section>

            <Section title="Ubicación">
              <Suspense
                fallback={
                  <p role="status" className="m-0 text-sm text-muted">
                    Cargando mapa…
                  </p>
                }
              >
                <LocationPicker
                  lat={markerPoint.lat}
                  lng={markerPoint.lng}
                  contextPlaces={contextPlaces}
                  editingId={place?.id ?? null}
                  onPick={(pickedLat, pickedLng) => {
                    dispatch({ type: 'coords', lat: toText(pickedLat), lng: toText(pickedLng) })
                    setErrors((prev) => ({ ...prev, lat: '', lng: '' }))
                  }}
                />
              </Suspense>
              <p className="m-0 text-sm text-muted">Haz clic en el mapa o arrastra el marcador; también puedes escribir las coordenadas.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitud" required inputMode="decimal" {...text('lat')} error={errors.lat || coordErrors.lat} />
                <Input label="Longitud" required inputMode="decimal" {...text('lng')} error={errors.lng || coordErrors.lng} />
              </div>
            </Section>

            <Section title="Horario">
              <Input label="Horario (resumen)" maxLength={300} {...text('schedule')} />
              <Textarea label="Detalle del horario" hint="Un tramo por línea." rows={3} {...text('detailedSchedule')} />
            </Section>

            <Section title="Contacto">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" maxLength={300} {...text('phone')} />
                <Input label="Anexo" maxLength={300} {...text('annex')} />
              </div>
              <Input label="Correo" type="email" maxLength={300} {...text('email')} />
              <Input label="Página web" inputMode="url" placeholder="https://" maxLength={300} {...text('website')} />
            </Section>

            <Section title="Descripción">
              <Textarea label="Descripción" rows={4} maxLength={5000} {...text('description')} />
              <Textarea label="Cómo encontrarlo" rows={2} maxLength={300} {...text('accessHint')} />
              <Input label="Para qué se usa" maxLength={300} {...text('usage')} />
            </Section>

            <Section title="Listas">
              <Textarea label="Palabras clave" hint="Una por línea. Sirven para buscar el lugar." rows={3} {...text('keywords')} />
              <Textarea label="Carreras" hint="Una por línea." rows={3} {...text('careers')} />
              <Textarea label="Servicios" hint="Uno por línea." rows={3} {...text('services')} />
            </Section>

            <Section title="Lugar que lo contiene">
              <Combobox
                id={fieldId('parentPlaceId')}
                label="Lugar que lo contiene"
                clearable
                options={parentOptions}
                value={form.parentPlaceId}
                error={errors.parentPlaceId}
                onChange={set('parentPlaceId')}
                placeholder="Ninguno"
              />
            </Section>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit(form) || saving} aria-busy={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>

        {confirmingDiscard && (
          <div
            role="alertdialog"
            aria-labelledby="discard-title"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg/95 p-6 text-center"
          >
            <h3 id="discard-title" className="m-0 text-lg">
              ¿Descartar los cambios?
            </h3>
            <p className="m-0 text-muted">Lo que escribiste no se ha guardado.</p>
            <div className="flex gap-3">
              <Button autoFocus variant="secondary" onClick={() => setConfirmingDiscard(false)}>
                Seguir editando
              </Button>
              <Button onClick={onClose}>Descartar</Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
