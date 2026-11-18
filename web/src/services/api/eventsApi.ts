import type { CampusEvent, EventCategory, EventModality, EventStatus } from '@/features/events/types'
import { ApiError, apiClient } from './client'

/** Forma cruda de `GET /api/events` (snake_case). */
export interface ApiEvent {
  id?: unknown
  slug?: unknown
  title?: unknown
  description?: string | null
  image_url?: string | null
  starts_at?: unknown
  ends_at?: unknown
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
  website?: string | null
  email?: string | null
  phone?: string | null
}

const CATEGORIES: EventCategory[] = ['academico', 'cultural', 'deportivo', 'feria', 'charla', 'taller', 'institucional', 'otro']
const STATUSES: EventStatus[] = ['scheduled', 'cancelled', 'postponed']
const MODALITIES: EventModality[] = ['in_person', 'online', 'hybrid']

const invalid = (endpoint: string, why: string) => new ApiError('invalid', `GET ${endpoint}: ${why}`)
const isText = (value: unknown): value is string => typeof value === 'string' && value !== ''
const isId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0

function text(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function date(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/** Convierte un evento de la API al formato de la web. Sin id, slug, título o fecha de inicio válidos es un error. */
export function toEvent(raw: ApiEvent, endpoint = '/api/events'): CampusEvent {
  const startsAt = date(raw.starts_at)
  if (!isId(raw.id) || !isText(raw.slug) || !isText(raw.title) || !startsAt) {
    throw invalid(endpoint, `un evento no trae id, slug, título o fecha de inicio válidos (${JSON.stringify(raw.id)})`)
  }
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: text(raw.description),
    imageUrl: text(raw.image_url),
    startsAt,
    endsAt: date(raw.ends_at),
    placeId: isId(raw.place_id) ? raw.place_id : undefined,
    locationDetail: text(raw.location_detail),
    category: oneOf(raw.category, CATEGORIES, 'otro'),
    organizer: text(raw.organizer),
    status: oneOf(raw.status, STATUSES, 'scheduled'),
    statusNote: text(raw.status_note),
    isFree: typeof raw.is_free === 'boolean' ? raw.is_free : undefined,
    priceNote: text(raw.price_note),
    audience: text(raw.audience),
    registrationUrl: text(raw.registration_url),
    registrationNote: text(raw.registration_note),
    modality: oneOf(raw.modality, MODALITIES, 'in_person'),
    onlineUrl: text(raw.online_url),
    agenda: Array.isArray(raw.agenda) && raw.agenda.length > 0 ? raw.agenda : undefined,
    website: text(raw.website),
    email: text(raw.email),
    phone: text(raw.phone),
  }
}

/** `GET /api/events`: eventos publicados, no cancelados y que aún no terminaron, por fecha. */
export async function fetchUpcomingEvents(options: { fresh?: boolean } = {}): Promise<CampusEvent[]> {
  const raw = await apiClient.get<ApiEvent[]>('/api/events', undefined, options)
  if (!Array.isArray(raw)) throw invalid('/api/events', 'la respuesta no es una lista')
  return raw.map((e) => toEvent(e))
}
