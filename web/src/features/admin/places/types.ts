/** Resultado de la sincronización con el asistente que informa el servidor (HU-30). */
export type RagSync = 'ok' | 'skipped' | 'failed'

/** Lugar tal como lo ve el administrador: publicado o no, con datos internos. */
export interface AdminPlace {
  id: string
  name: string
  shortName: string | null
  categoryId: string
  lat: number
  lng: number
  keywords: string[]
  description: string | null
  schedule: string | null
  detailedSchedule: string[]
  phone: string | null
  annex: string | null
  email: string | null
  website: string | null
  accessHint: string | null
  careers: string[]
  services: string[]
  usage: string | null
  imageUrl: string | null
  parentPlaceId: string | null
  isPublished: boolean
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}

/** Lo que se envía al guardar un lugar: reemplazo completo, sin `id` ni datos internos. */
export interface AdminPlaceInput {
  name: string
  categoryId: string
  lat: number
  lng: number
  shortName: string | null
  keywords: string[]
  description: string | null
  schedule: string | null
  detailedSchedule: string[]
  phone: string | null
  annex: string | null
  email: string | null
  website: string | null
  accessHint: string | null
  careers: string[]
  services: string[]
  usage: string | null
  imageUrl: string | null
  parentPlaceId: string | null
  isPublished: boolean
  verified: boolean
}

export interface AdminCategory {
  id: string
  label: string
  color: string
  sortOrder: number
  placesCount: number
}

export interface AdminCategoryInput {
  /** Solo al crear. */
  id?: string
  label: string
  color: string
  /** `null`: al crear queda al final; al editar se conserva. */
  sortOrder: number | null
}

export interface SavedPlace {
  place: AdminPlace
  ragSync: RagSync
}
