import type { AdminCategory, AdminPlace } from '@/features/admin/places/types'

export const ADMIN_CATEGORIES: AdminCategory[] = [
  { id: 'facultades', label: 'Facultades', color: '#3056ac', sortOrder: 0, placesCount: 2 },
  { id: 'puertas', label: 'Puertas', color: '#e74c3c', sortOrder: 1, placesCount: 1 },
  { id: 'vacia', label: 'Vacía', color: '#757575', sortOrder: 2, placesCount: 0 },
]

export function adminPlace(id: string, overrides: Partial<AdminPlace> = {}): AdminPlace {
  return {
    id,
    name: id,
    shortName: null,
    categoryId: 'facultades',
    lat: -12.0535,
    lng: -77.0857,
    keywords: [],
    description: null,
    schedule: null,
    detailedSchedule: [],
    phone: null,
    annex: null,
    email: null,
    website: null,
    accessHint: null,
    careers: [],
    services: [],
    usage: null,
    imageUrl: null,
    parentPlaceId: null,
    isPublished: true,
    verifiedAt: null,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    updatedBy: 'admin',
    ...overrides,
  }
}

export const ADMIN_PLACES: AdminPlace[] = [
  adminPlace('fisi', {
    name: 'Facultad de Ingeniería de Sistemas e Informática',
    shortName: 'FISI',
    keywords: ['informática', 'software'],
    phone: '619-7000',
    careers: ['Ingeniería de Software'],
    verifiedAt: '2026-11-05T09:00:00Z',
  }),
  adminPlace('psicologia', { name: 'Facultad de Psicología', shortName: 'Psicología' }),
  adminPlace('puerta-3', { name: 'Puerta 3', categoryId: 'puertas', lat: -12.0571, lng: -77.08, isPublished: false }),
]

/** Respuesta cruda de la API para un lugar (snake_case), como la manda el servidor. */
export function rawPlace(p: AdminPlace, ragSync?: string) {
  return {
    id: p.id, name: p.name, short_name: p.shortName, category_id: p.categoryId, lat: p.lat, lng: p.lng,
    keywords: p.keywords, description: p.description, schedule: p.schedule,
    detailed_schedule: p.detailedSchedule, phone: p.phone, annex: p.annex, email: p.email,
    website: p.website, access_hint: p.accessHint, careers: p.careers, services: p.services,
    usage: p.usage, image_url: p.imageUrl, parent_place_id: p.parentPlaceId,
    is_published: p.isPublished, verified_at: p.verifiedAt, created_at: p.createdAt,
    updated_at: p.updatedAt, updated_by: p.updatedBy, ...(ragSync ? { rag_sync: ragSync } : {}),
  }
}
