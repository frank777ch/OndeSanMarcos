import type { Place, PlaceCategory } from '@/features/map/types'
import { ApiError, apiClient } from './client'

/** Forma cruda de `GET /api/places` (snake_case, HU-27). */
interface ApiPlace {
  id?: unknown
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
  parent_place_id?: string | null
  verified_at?: string | null
}

interface ApiCategory {
  id?: unknown
  label?: unknown
  color?: unknown
}

export interface PlacesData {
  places: Place[]
  categories: PlaceCategory[]
}

const invalid = (endpoint: string, why: string) =>
  new ApiError('invalid', `GET ${endpoint}: ${why}`)

const isText = (value: unknown): value is string => typeof value === 'string' && value !== ''
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** Texto vacío o nulo → sin dato. */
function text(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

/** Lista vacía o nula → sin dato. */
function list(value: string[] | null | undefined): string[] | undefined {
  return Array.isArray(value) && value.length > 0 ? value : undefined
}

/** Convierte un lugar de la API al formato de la web (RF-28.2). */
export function toPlace(raw: ApiPlace): Place {
  if (!isText(raw.id) || !isText(raw.name) || !isText(raw.category_id) || !isNumber(raw.lat) || !isNumber(raw.lng)) {
    throw invalid('/api/places', `un lugar no trae id, nombre, categoría o coordenadas válidos (${JSON.stringify(raw.id)})`)
  }
  return {
    id: raw.id,
    name: raw.name,
    shortName: text(raw.short_name),
    category: raw.category_id,
    coordinates: [raw.lng, raw.lat],
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    schedule: text(raw.schedule),
    description: text(raw.description),
    phone: text(raw.phone),
    annex: text(raw.annex),
    email: text(raw.email),
    website: text(raw.website),
    accessHint: text(raw.access_hint),
    careers: list(raw.careers),
    services: list(raw.services),
    usage: text(raw.usage),
    detailedSchedule: list(raw.detailed_schedule),
    imageUrl: text(raw.image_url),
    parentPlaceId: text(raw.parent_place_id),
    verifiedAt: text(raw.verified_at),
  }
}

function toCategory(raw: ApiCategory): PlaceCategory {
  if (!isText(raw.id) || !isText(raw.label) || !isText(raw.color)) {
    throw invalid('/api/place-categories', `una categoría no trae id, etiqueta o color (${JSON.stringify(raw.id)})`)
  }
  return { id: raw.id, label: raw.label, color: raw.color }
}

/**
 * Pide los lugares publicados y las categorías (RF-28.1). Ambas peticiones van en
 * paralelo; si una falla, falla todo. Una respuesta que no es una lista es un error.
 */
export async function fetchPlacesAndCategories(options: { fresh?: boolean } = {}): Promise<PlacesData> {
  const [rawPlaces, rawCategories] = await Promise.all([
    apiClient.get<ApiPlace[]>('/api/places', undefined, options),
    apiClient.get<ApiCategory[]>('/api/place-categories', undefined, options),
  ])
  if (!Array.isArray(rawPlaces)) throw invalid('/api/places', 'la respuesta no es una lista')
  if (!Array.isArray(rawCategories)) throw invalid('/api/place-categories', 'la respuesta no es una lista')
  return { places: rawPlaces.map(toPlace), categories: rawCategories.map(toCategory) }
}

/** `GET /api/places/search` (HU-36): lugares publicados que coinciden, tolerando tildes y errores de escritura. */
export async function searchPlacesApi(query: string, signal?: AbortSignal): Promise<Place[]> {
  const endpoint = `/api/places/search?q=${encodeURIComponent(query)}`
  const raw = await apiClient.get<ApiPlace[]>(endpoint, undefined, { signal })
  if (!Array.isArray(raw)) throw invalid('/api/places/search', 'la respuesta no es una lista')
  return raw.map(toPlace)
}
