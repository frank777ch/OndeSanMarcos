/** Resultado de la sincronización con el asistente que informa el servidor (HU-30). */
export type RagSync = 'ok' | 'skipped' | 'failed'

/** Lugar tal como lo ve el administrador: publicado o no, con datos internos. */
export interface AdminPlace {
  id: number
  /** Nombre estandarizado (minúsculas y guiones). Lo genera el sistema y no cambia al renombrar. */
  slug: string
  name: string
  shortName: string | null
  categoryId: number
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
  parentPlaceId: number | null
  isPublished: boolean
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  updatedBy: string | null
}

/** Lo que se envía al guardar un lugar: reemplazo completo, sin `id` ni datos internos. */
export interface AdminPlaceInput {
  name: string
  categoryId: number
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
  parentPlaceId: number | null
  isPublished: boolean
  verified: boolean
}

export interface AdminCategory {
  id: number
  /** Nombre estandarizado, generado del nombre al crear; solo lectura. */
  slug: string
  label: string
  color: string
  sortOrder: number
  placesCount: number
}

export interface AdminCategoryInput {
  label: string
  color: string
  /** `null`: al crear queda al final; al editar se conserva. */
  sortOrder: number | null
}

export interface SavedPlace {
  place: AdminPlace
  ragSync: RagSync
}
