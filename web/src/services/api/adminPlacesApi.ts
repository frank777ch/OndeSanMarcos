import type {
  AdminCategory,
  AdminCategoryInput,
  AdminPlace,
  AdminPlaceInput,
  RagSync,
  SavedPlace,
} from '@/features/admin/places/types'
import { adminClient } from './adminClient'
import { ApiError } from './client'

const invalid = (endpoint: string, why: string) => new ApiError('invalid', `${endpoint}: ${why}`)

// --- lectura -----------------------------------------------------------------

interface RawPlace {
  id?: unknown
  slug?: unknown
  name?: unknown
  short_name?: string | null
  category_id?: unknown
  lat?: unknown
  lng?: unknown
  keywords?: string[] | null
  description?: string | null
  schedule?: string | null
  detailed_schedule?: string[] | null
  phone?: string | null
  annex?: string | null
  email?: string | null
  website?: string | null
  access_hint?: string | null
  careers?: string[] | null
  services?: string[] | null
  usage?: string | null
  image_url?: string | null
  parent_place_id?: number | null
  is_published?: unknown
  verified_at?: string | null
  created_at?: unknown
  updated_at?: unknown
  updated_by?: string | null
  rag_sync?: unknown
}

export function toAdminPlace(raw: RawPlace, endpoint = '/api/admin/places'): AdminPlace {
  if (
    !Number.isInteger(raw?.id) ||
    typeof raw.slug !== 'string' ||
    typeof raw.name !== 'string' ||
    !Number.isInteger(raw.category_id) ||
    typeof raw.lat !== 'number' ||
    typeof raw.lng !== 'number'
  ) {
    throw invalid(endpoint, 'un lugar no trae id, nombre, categoría o coordenadas')
  }
  return {
    id: raw.id as number,
    slug: raw.slug,
    name: raw.name,
    shortName: raw.short_name ?? null,
    categoryId: raw.category_id as number,
    lat: raw.lat,
    lng: raw.lng,
    keywords: raw.keywords ?? [],
    description: raw.description ?? null,
    schedule: raw.schedule ?? null,
    detailedSchedule: raw.detailed_schedule ?? [],
    phone: raw.phone ?? null,
    annex: raw.annex ?? null,
    email: raw.email ?? null,
    website: raw.website ?? null,
    accessHint: raw.access_hint ?? null,
    careers: raw.careers ?? [],
    services: raw.services ?? [],
    usage: raw.usage ?? null,
    imageUrl: raw.image_url ?? null,
    parentPlaceId: raw.parent_place_id ?? null,
    isPublished: raw.is_published !== false,
    verifiedAt: raw.verified_at ?? null,
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
    updatedBy: raw.updated_by ?? null,
  }
}

function toRagSync(value: unknown): RagSync {
  return value === 'ok' || value === 'skipped' || value === 'failed' ? value : 'skipped'
}

export async function listAdminPlaces(): Promise<AdminPlace[]> {
  const raw = await adminClient.get<RawPlace[]>('/api/admin/places')
  if (!Array.isArray(raw)) throw invalid('/api/admin/places', 'la respuesta no es una lista')
  return raw.map((p) => toAdminPlace(p))
}

interface RawCategory {
  id?: unknown
  slug?: unknown
  label?: unknown
  color?: unknown
  sort_order?: unknown
  places_count?: unknown
}

function toAdminCategory(raw: RawCategory): AdminCategory {
  if (!Number.isInteger(raw?.id) || typeof raw.slug !== 'string' || typeof raw.label !== 'string' || typeof raw.color !== 'string') {
    throw invalid('/api/admin/place-categories', 'una categoría no trae id, nombre o color')
  }
  return {
    id: raw.id as number,
    slug: raw.slug,
    label: raw.label,
    color: raw.color,
    sortOrder: typeof raw.sort_order === 'number' ? raw.sort_order : 0,
    placesCount: typeof raw.places_count === 'number' ? raw.places_count : 0,
  }
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const raw = await adminClient.get<RawCategory[]>('/api/admin/place-categories')
  if (!Array.isArray(raw)) throw invalid('/api/admin/place-categories', 'la respuesta no es una lista')
  return raw.map(toAdminCategory)
}

// --- escritura ---------------------------------------------------------------

function toBody(input: AdminPlaceInput) {
  return {
    name: input.name,
    category_id: input.categoryId,
    lat: input.lat,
    lng: input.lng,
    short_name: input.shortName,
    keywords: input.keywords,
    description: input.description,
    schedule: input.schedule,
    detailed_schedule: input.detailedSchedule,
    phone: input.phone,
    annex: input.annex,
    email: input.email,
    website: input.website,
    access_hint: input.accessHint,
    careers: input.careers,
    services: input.services,
    usage: input.usage,
    image_url: input.imageUrl,
    parent_place_id: input.parentPlaceId,
    is_published: input.isPublished,
    verified: input.verified,
  }
}

function toSaved(raw: RawPlace, endpoint: string): SavedPlace {
  return { place: toAdminPlace(raw, endpoint), ragSync: toRagSync(raw?.rag_sync) }
}

/** `id` nulo crea (`POST`); con `id` reemplaza el lugar (`PUT`). */
export async function saveAdminPlace(id: number | null, input: AdminPlaceInput): Promise<SavedPlace> {
  const body = toBody(input)
  if (id === null) {
    return toSaved(await adminClient.post<RawPlace>('/api/admin/places', body), '/api/admin/places')
  }
  const endpoint = `/api/admin/places/${id}`
  return toSaved(await adminClient.put<RawPlace>(endpoint, body), endpoint)
}

export async function reindexAdminPlace(id: number): Promise<SavedPlace> {
  const endpoint = `/api/admin/places/${id}/reindex`
  return toSaved(await adminClient.post<RawPlace>(endpoint, {}), endpoint)
}

/**
 * Entrada completa a partir de un lugar ya guardado, con algunos cambios. La API reemplaza todos los
 * campos, así que una acción de fila (publicar, verificar) debe reenviar el resto intacto (RF-31.9).
 */
export function toInput(
  place: AdminPlace,
  changes: Partial<AdminPlaceInput> = {},
): AdminPlaceInput {
  return {
    name: place.name,
    categoryId: place.categoryId,
    lat: place.lat,
    lng: place.lng,
    shortName: place.shortName,
    keywords: place.keywords,
    description: place.description,
    schedule: place.schedule,
    detailedSchedule: place.detailedSchedule,
    phone: place.phone,
    annex: place.annex,
    email: place.email,
    website: place.website,
    accessHint: place.accessHint,
    careers: place.careers,
    services: place.services,
    usage: place.usage,
    imageUrl: place.imageUrl,
    parentPlaceId: place.parentPlaceId,
    isPublished: place.isPublished,
    verified: place.verifiedAt !== null,
    ...changes,
  }
}

export async function saveAdminCategory(
  id: number | null,
  input: AdminCategoryInput,
): Promise<AdminCategory> {
  const body = { label: input.label, color: input.color, sort_order: input.sortOrder }
  if (id === null) {
    const created = await adminClient.post<RawCategory>('/api/admin/place-categories', body)
    return toAdminCategory(created)
  }
  const updated = await adminClient.put<RawCategory>(
    `/api/admin/place-categories/${id}`,
    body,
  )
  return toAdminCategory(updated)
}

export async function deleteAdminCategory(id: number): Promise<void> {
  await adminClient.delete(`/api/admin/place-categories/${id}`)
}

// --- errores -----------------------------------------------------------------

export interface FormErrors {
  /** Mensaje por campo del formulario (nombres en camelCase). */
  fields: Record<string, string>
  /** Mensaje que no corresponde a un campo. */
  general?: string
}

const camel = (name: string) => name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

/** Los mensajes de pydantic vienen en inglés o con el prefijo «Value error, »: se pasan a un texto claro. */
export function friendlyMessage(msg: string): string {
  const clean = msg.replace(/^Value error, /, '')
  if (/^Field required/i.test(clean)) return 'Este campo es obligatorio.'
  if (/valid number|valid integer/i.test(clean)) return 'Debe ser un número.'
  if (/at least 1 character/i.test(clean)) return 'No puede estar vacío.'
  const most = clean.match(/at most (\d+) characters/i)
  if (most) return `Máximo ${most[1]} caracteres.`
  if (/Extra inputs are not permitted/i.test(clean)) return 'Campo no permitido.'
  if (/greater than or equal/i.test(clean)) return 'El valor es demasiado pequeño.'
  if (/less than or equal/i.test(clean)) return 'El valor es demasiado grande.'
  return clean
}

/** Lee el `detail` de FastAPI (422 y 409) y lo reparte por campo del formulario. */
export function parseFieldErrors(error: unknown): FormErrors {
  const body = error instanceof ApiError ? (error.body as { detail?: unknown } | undefined) : undefined
  const detail = body?.detail
  if (typeof detail === 'string') return { fields: {}, general: detail }
  if (!Array.isArray(detail)) return { fields: {} }
  const result: FormErrors = { fields: {} }
  for (const item of detail as { loc?: unknown; msg?: unknown }[]) {
    if (typeof item?.msg !== 'string') continue
    const loc = Array.isArray(item.loc) ? item.loc : []
    const last = loc[loc.length - 1]
    const message = friendlyMessage(item.msg)
    if (typeof last === 'string' && loc.length >= 2) {
      const field = camel(last)
      if (!(field in result.fields)) result.fields[field] = message
    } else if (!result.general) {
      result.general = message
    }
  }
  return result
}
