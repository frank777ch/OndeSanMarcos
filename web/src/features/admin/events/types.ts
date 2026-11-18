import type { EventCategory, EventModality, EventStatus } from '@/features/events/types'
import type { RagSync } from '../places/types'

/** Evento tal como lo devuelve la administración (con lo no público). */
export interface AdminEvent {
  id: number
  slug: string
  title: string
  description: string | null
  imageUrl: string | null
  startsAt: string
  endsAt: string | null
  placeId: number | null
  locationDetail: string | null
  category: EventCategory
  organizer: string | null
  status: EventStatus
  statusNote: string | null
  isFree: boolean | null
  priceNote: string | null
  audience: string | null
  registrationUrl: string | null
  registrationNote: string | null
  modality: EventModality
  onlineUrl: string | null
  agenda: string[]
  keywords: string[]
  website: string | null
  email: string | null
  phone: string | null
  isPublished: boolean
  updatedAt: string
  updatedBy: string | null
}

/** Lo que se envía al guardar: todos los campos editables (la API reemplaza). Fechas en «YYYY-MM-DDTHH:mm», hora de Lima. */
export type AdminEventInput = Omit<AdminEvent, 'id' | 'slug' | 'updatedAt' | 'updatedBy' | 'startsAt' | 'endsAt'> & {
  startsAt: string
  endsAt: string | null
}

export interface SavedEvent {
  event: AdminEvent
  ragSync: RagSync
}
