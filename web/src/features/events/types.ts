export type EventCategory = 'academico' | 'cultural' | 'deportivo' | 'feria' | 'charla' | 'taller' | 'institucional' | 'otro'
export type EventStatus = 'scheduled' | 'cancelled' | 'postponed'
export type EventModality = 'in_person' | 'online' | 'hybrid'

/** Evento del campus tal como lo ve el público (`GET /api/events`). */
export interface CampusEvent {
  id: number
  slug: string
  title: string
  description?: string
  imageUrl?: string
  startsAt: Date
  /** Fin; sin él se considera terminado al acabar el día de inicio (hora de Lima). */
  endsAt?: Date
  /** Lugar donde ocurre; sin él (evento virtual) no se puede dibujar en el mapa. */
  placeId?: number
  /** Sala o referencia dentro del lugar. */
  locationDetail?: string
  category: EventCategory
  organizer?: string
  status: EventStatus
  statusNote?: string
  /** `true` gratis, `false` con costo, ausente si no se indicó. */
  isFree?: boolean
  priceNote?: string
  audience?: string
  registrationUrl?: string
  registrationNote?: string
  modality: EventModality
  onlineUrl?: string
  agenda?: string[]
  website?: string
  email?: string
  phone?: string
}
