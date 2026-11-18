import type { CampusEvent, EventCategory, EventModality, EventStatus } from '../types'

/** Lima es UTC-5 todo el año (sin horario de verano): el desfase fijo evita depender de la zona del navegador. */
const LIMA_OFFSET_MS = -5 * 3_600_000
const DAY_MS = 86_400_000
export const LIMA_TIME_ZONE = 'America/Lima'

/** Cuándo se considera terminado el evento: su fin, o la medianoche de Lima tras el día de inicio. */
export function eventEnd(event: Pick<CampusEvent, 'startsAt' | 'endsAt'>): Date {
  if (event.endsAt) return event.endsAt
  const localStart = event.startsAt.getTime() + LIMA_OFFSET_MS
  const dayStartLocal = Math.floor(localStart / DAY_MS) * DAY_MS
  return new Date(dayStartLocal + DAY_MS - LIMA_OFFSET_MS)
}

/** Si el evento aún no terminó. */
export function isUpcoming(event: Pick<CampusEvent, 'startsAt' | 'endsAt'>, now: number = Date.now()): boolean {
  return eventEnd(event).getTime() > now
}

const part = (parts: Intl.DateTimeFormatPart[], type: string) => parts.find((p) => p.type === type)?.value ?? ''

function dayText(date: Date, style: 'long' | 'short'): string {
  const parts = new Intl.DateTimeFormat('es-PE', {
    weekday: style,
    day: 'numeric',
    month: style,
    timeZone: LIMA_TIME_ZONE,
  }).formatToParts(date)
  return style === 'long'
    ? `${part(parts, 'weekday')} ${part(parts, 'day')} de ${part(parts, 'month')}`
    : `${part(parts, 'day')} ${part(parts, 'month').replace('.', '')}`
}

function hourText(date: Date): string {
  const parts = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: LIMA_TIME_ZONE,
  }).formatToParts(date)
  return `${part(parts, 'hour')}:${part(parts, 'minute')}`
}

const sameDay = (a: Date, b: Date) => dayText(a, 'long') === dayText(b, 'long')

/** Fecha y hora en español y en hora de Lima: «domingo 22 de noviembre, de 10:00 a 13:00». */
export function formatEventWhen(event: Pick<CampusEvent, 'startsAt' | 'endsAt'>): string {
  const { startsAt, endsAt } = event
  if (!endsAt) return `${dayText(startsAt, 'long')}, ${hourText(startsAt)}`
  if (sameDay(startsAt, endsAt)) return `${dayText(startsAt, 'long')}, de ${hourText(startsAt)} a ${hourText(endsAt)}`
  return `del ${dayText(startsAt, 'short')} (${hourText(startsAt)}) al ${dayText(endsAt, 'short')} (${hourText(endsAt)})`
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  academico: 'Académico',
  cultural: 'Cultural',
  deportivo: 'Deportivo',
  feria: 'Feria',
  charla: 'Charla o conferencia',
  taller: 'Taller',
  institucional: 'Institucional',
  otro: 'Otro',
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: 'Programado',
  cancelled: 'Cancelado',
  postponed: 'Reprogramado',
}

export const EVENT_MODALITY_LABELS: Record<EventModality, string> = {
  in_person: 'Presencial',
  online: 'Virtual',
  hybrid: 'Híbrido',
}
