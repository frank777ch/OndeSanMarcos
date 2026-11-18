import type { AdminEvent, AdminEventInput } from '../types'
import { listFromText, listToText } from '../../places/utils/form'

const LIMA_OFFSET_MS = -5 * 3_600_000

/** Instante (ISO) → «YYYY-MM-DDTHH:mm» en hora de Lima, el formato de `datetime-local`. */
export function toLimaInput(iso: string | null): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t + LIMA_OFFSET_MS).toISOString().slice(0, 16)
}

/** Estado del formulario: textos como los escribe el administrador. */
export interface EventForm {
  title: string
  description: string
  imageUrl: string
  startsAt: string
  endsAt: string
  placeId: number | null
  locationDetail: string
  category: AdminEvent['category']
  organizer: string
  status: AdminEvent['status']
  statusNote: string
  /** `''` sin dato, `'yes'` gratis, `'no'` con costo. */
  isFree: '' | 'yes' | 'no'
  priceNote: string
  audience: string
  registrationUrl: string
  registrationNote: string
  modality: AdminEvent['modality']
  onlineUrl: string
  agenda: string
  keywords: string
  website: string
  email: string
  phone: string
  isPublished: boolean
}

export function emptyEventForm(): EventForm {
  return {
    title: '', description: '', imageUrl: '', startsAt: '', endsAt: '', placeId: null, locationDetail: '',
    category: 'otro', organizer: '', status: 'scheduled', statusNote: '', isFree: '', priceNote: '', audience: '',
    registrationUrl: '', registrationNote: '', modality: 'in_person', onlineUrl: '', agenda: '', keywords: '',
    website: '', email: '', phone: '', isPublished: true,
  }
}

export function eventToForm(e: AdminEvent): EventForm {
  return {
    title: e.title, description: e.description ?? '', imageUrl: e.imageUrl ?? '',
    startsAt: toLimaInput(e.startsAt), endsAt: toLimaInput(e.endsAt), placeId: e.placeId,
    locationDetail: e.locationDetail ?? '', category: e.category, organizer: e.organizer ?? '',
    status: e.status, statusNote: e.statusNote ?? '', isFree: e.isFree === null ? '' : e.isFree ? 'yes' : 'no',
    priceNote: e.priceNote ?? '', audience: e.audience ?? '', registrationUrl: e.registrationUrl ?? '',
    registrationNote: e.registrationNote ?? '', modality: e.modality, onlineUrl: e.onlineUrl ?? '',
    agenda: listToText(e.agenda), keywords: listToText(e.keywords), website: e.website ?? '',
    email: e.email ?? '', phone: e.phone ?? '', isPublished: e.isPublished,
  }
}

const orNull = (s: string) => (s.trim() === '' ? null : s.trim())

/** Fecha sin zona («YYYY-MM-DDTHH:mm»): el servidor la toma como hora de Lima. */
const withSeconds = (s: string) => (s ? `${s}:00` : null)

export function formToEventInput(f: EventForm): AdminEventInput {
  return {
    title: f.title.trim(), description: orNull(f.description), imageUrl: orNull(f.imageUrl),
    startsAt: withSeconds(f.startsAt) ?? '', endsAt: withSeconds(f.endsAt), placeId: f.placeId,
    locationDetail: orNull(f.locationDetail), category: f.category, organizer: orNull(f.organizer),
    status: f.status, statusNote: orNull(f.statusNote), isFree: f.isFree === '' ? null : f.isFree === 'yes',
    priceNote: orNull(f.priceNote), audience: orNull(f.audience), registrationUrl: orNull(f.registrationUrl),
    registrationNote: orNull(f.registrationNote), modality: f.modality, onlineUrl: orNull(f.onlineUrl),
    agenda: listFromText(f.agenda), keywords: listFromText(f.keywords), website: orNull(f.website),
    email: orNull(f.email), phone: orNull(f.phone), isPublished: f.isPublished,
  }
}

export const isEventDirty = (a: EventForm, b: EventForm) => JSON.stringify(a) !== JSON.stringify(b)

/** Título y fecha de inicio son obligatorios; el fin no puede ser anterior al inicio. */
export function endError(f: EventForm): string | undefined {
  return f.startsAt && f.endsAt && f.endsAt < f.startsAt ? 'El fin no puede ser anterior al inicio.' : undefined
}

export const canSubmitEvent = (f: EventForm) => f.title.trim() !== '' && f.startsAt !== '' && !endError(f)
