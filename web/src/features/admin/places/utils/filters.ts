import { normalizeText } from '@/features/map/utils/search'
import type { AdminPlace } from '../types'

export const PAGE_SIZE = 20

export type TriState = 'all' | 'yes' | 'no'

export interface PlaceFilters {
  q: string
  categoryId: number | null
  published: TriState
  verified: TriState
}

export const EMPTY_FILTERS: PlaceFilters = { q: '', categoryId: null, published: 'all', verified: 'all' }

export const hasActiveFilters = (f: PlaceFilters) =>
  f.q.trim() !== '' || f.categoryId !== null || f.published !== 'all' || f.verified !== 'all'

const matchesTri = (value: boolean, filter: TriState) =>
  filter === 'all' || (filter === 'yes') === value

/** Búsqueda y filtros combinados con «y» (RF-31.4); la búsqueda ignora tildes y mayúsculas. */
export function filterPlaces(places: AdminPlace[], filters: PlaceFilters): AdminPlace[] {
  const needle = normalizeText(filters.q)
  return places.filter((p) => {
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false
    if (!matchesTri(p.isPublished, filters.published)) return false
    if (!matchesTri(p.verifiedAt !== null, filters.verified)) return false
    if (!needle) return true
    return [String(p.id), p.slug, p.name, p.shortName ?? '', ...p.keywords].some((t) => normalizeText(t).includes(needle))
  })
}

export function pageCount(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size))
}

/** Deja la página dentro de lo que existe (RF-31.6a). */
export function clampPage(page: number, total: number, size = PAGE_SIZE): number {
  return Math.min(Math.max(1, page), pageCount(total, size))
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): T[] {
  const current = clampPage(page, items.length, size)
  return items.slice((current - 1) * size, current * size)
}
