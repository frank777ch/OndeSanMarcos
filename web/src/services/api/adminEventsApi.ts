import type { AdminEvent, AdminEventInput, SavedEvent } from '@/features/admin/events/types'
import type { RagSync } from '@/features/admin/places/types'
import type { EventCategory, EventModality, EventStatus } from '@/features/events/types'
import { adminClient } from './adminClient'
import { ApiError } from './client'

interface RawEvent {
  id?: unknown
  slug?: unknown
  title?: unknown
  description?: string | null
  image_url?: string | null
  starts_at?: unknown
  ends_at?: string | null
  place_id?: number | null
  location_detail?: string | null
  category?: unknown
  organizer?: string | null
  status?: unknown
  status_note?: string | null
  is_free?: boolean | null
  price_note?: string | null
  audience?: string | null
  registration_url?: string | null
  registration_note?: string | null
  modality?: unknown
  online_url?: string | null
  agenda?: string[] | null
  keywords?: string[] | null
  website?: string | null
  email?: string | null
  phone?: string | null
  is_published?: unknown
  updated_at?: unknown
  updated_by?: string | null
  rag_sync?: unknown
}

export function toAdminEvent(raw: RawEvent, endpoint = '/api/admin/events'): AdminEvent {
  if (!Number.isInteger(raw?.id) || typeof raw.slug !== 'string' || typeof raw.title !== 'string' || typeof raw.starts_at !== 'string') {
    throw new ApiError('invalid', `${endpoint}: un evento no trae id, título o fecha de inicio`)
  }
  return {
    id: raw.id as number, slug: raw.slug, title: raw.title, description: raw.description ?? null,
    imageUrl: raw.image_url ?? null, startsAt: raw.starts_at, endsAt: raw.ends_at ?? null,
    placeId: raw.place_id ?? null, locationDetail: raw.location_detail ?? null,
    category: (raw.category as EventCategory) ?? 'otro', organizer: raw.organizer ?? null,
    status: (raw.status as EventStatus) ?? 'scheduled', statusNote: raw.status_note ?? null,
    isFree: typeof raw.is_free === 'boolean' ? raw.is_free : null, priceNote: raw.price_note ?? null,
    audience: raw.audience ?? null, registrationUrl: raw.registration_url ?? null,
    registrationNote: raw.registration_note ?? null, modality: (raw.modality as EventModality) ?? 'in_person',
    onlineUrl: raw.online_url ?? null, agenda: raw.agenda ?? [], keywords: raw.keywords ?? [],
    website: raw.website ?? null, email: raw.email ?? null, phone: raw.phone ?? null,
    isPublished: raw.is_published !== false, updatedAt: String(raw.updated_at ?? ''), updatedBy: raw.updated_by ?? null,
  }
}

const toRagSync = (v: unknown): RagSync => (v === 'ok' || v === 'skipped' || v === 'failed' ? v : 'skipped')

export async function listAdminEvents(): Promise<AdminEvent[]> {
  const raw = await adminClient.get<RawEvent[]>('/api/admin/events')
  if (!Array.isArray(raw)) throw new ApiError('invalid', '/api/admin/events: la respuesta no es una lista')
  return raw.map((e) => toAdminEvent(e))
}

function toBody(i: AdminEventInput) {
  return {
    title: i.title, description: i.description, image_url: i.imageUrl, starts_at: i.startsAt, ends_at: i.endsAt,
    place_id: i.placeId, location_detail: i.locationDetail, category: i.category, organizer: i.organizer,
    status: i.status, status_note: i.statusNote, is_free: i.isFree, price_note: i.priceNote, audience: i.audience,
    registration_url: i.registrationUrl, registration_note: i.registrationNote, modality: i.modality,
    online_url: i.onlineUrl, agenda: i.agenda, keywords: i.keywords, website: i.website, email: i.email,
    phone: i.phone, is_published: i.isPublished,
  }
}

const toSaved = (raw: RawEvent, endpoint: string): SavedEvent => ({
  event: toAdminEvent(raw, endpoint),
  ragSync: toRagSync(raw?.rag_sync),
})

/** `id` nulo crea (`POST`); con `id` reemplaza el evento (`PUT`). */
export async function saveAdminEvent(id: number | null, input: AdminEventInput): Promise<SavedEvent> {
  const body = toBody(input)
  if (id === null) return toSaved(await adminClient.post<RawEvent>('/api/admin/events', body), '/api/admin/events')
  const endpoint = `/api/admin/events/${id}`
  return toSaved(await adminClient.put<RawEvent>(endpoint, body), endpoint)
}

export async function reindexAdminEvent(id: number): Promise<SavedEvent> {
  const endpoint = `/api/admin/events/${id}/reindex`
  return toSaved(await adminClient.post<RawEvent>(endpoint, {}), endpoint)
}

export async function deleteAdminEvent(id: number): Promise<RagSync> {
  const raw = await adminClient.delete<{ rag_sync?: unknown }>(`/api/admin/events/${id}`)
  return toRagSync(raw?.rag_sync)
}

/** Entrada completa a partir de un evento guardado (la API reemplaza todo: una acción de fila reenvía el resto intacto). */
export function eventToInput(e: AdminEvent, changes: Partial<AdminEventInput> = {}): AdminEventInput {
  const { id: _id, slug: _slug, updatedAt: _u, updatedBy: _b, ...rest } = e
  return { ...rest, ...changes }
}
