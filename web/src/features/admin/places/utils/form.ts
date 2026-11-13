import { inPlaceArea } from './bounds'
import type { AdminPlace, AdminPlaceInput } from '../types'

/** Estado del formulario: todo como texto, como lo escribe el administrador. */
export interface PlaceForm {
  name: string
  shortName: string
  categoryId: string | null
  lat: string
  lng: string
  keywords: string
  description: string
  schedule: string
  detailedSchedule: string
  phone: string
  annex: string
  email: string
  website: string
  accessHint: string
  careers: string
  services: string
  usage: string
  imageUrl: string
  parentPlaceId: string | null
  isPublished: boolean
  verified: boolean
}

/** Un elemento por línea; sin líneas vacías ni repetidas (RF-31.14a). */
export function listFromText(text: string): string[] {
  const seen = new Set<string>()
  const items: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const item = line.trim()
    const key = item.toLowerCase()
    if (!item || seen.has(key)) continue
    seen.add(key)
    items.push(item)
  }
  return items
}

export const listToText = (items: string[]) => items.join('\n')

export function emptyForm(): PlaceForm {
  return {
    name: '', shortName: '', categoryId: null, lat: '', lng: '', keywords: '', description: '',
    schedule: '', detailedSchedule: '', phone: '', annex: '', email: '', website: '', accessHint: '',
    careers: '', services: '', usage: '', imageUrl: '', parentPlaceId: null, isPublished: true,
    verified: false,
  }
}

export function placeToForm(place: AdminPlace): PlaceForm {
  return {
    name: place.name,
    shortName: place.shortName ?? '',
    categoryId: place.categoryId,
    lat: String(place.lat),
    lng: String(place.lng),
    keywords: listToText(place.keywords),
    description: place.description ?? '',
    schedule: place.schedule ?? '',
    detailedSchedule: listToText(place.detailedSchedule),
    phone: place.phone ?? '',
    annex: place.annex ?? '',
    email: place.email ?? '',
    website: place.website ?? '',
    accessHint: place.accessHint ?? '',
    careers: listToText(place.careers),
    services: listToText(place.services),
    usage: place.usage ?? '',
    imageUrl: place.imageUrl ?? '',
    parentPlaceId: place.parentPlaceId,
    isPublished: place.isPublished,
    verified: place.verifiedAt !== null,
  }
}

const orNull = (text: string) => (text.trim() === '' ? null : text.trim())

/** Convierte el formulario en lo que acepta la API. Solo se llama cuando `canSubmit` es verdadero. */
export function formToInput(form: PlaceForm): AdminPlaceInput {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId ?? '',
    lat: Number(form.lat),
    lng: Number(form.lng),
    shortName: orNull(form.shortName),
    keywords: listFromText(form.keywords),
    description: orNull(form.description),
    schedule: orNull(form.schedule),
    detailedSchedule: listFromText(form.detailedSchedule),
    phone: orNull(form.phone),
    annex: orNull(form.annex),
    email: orNull(form.email),
    website: orNull(form.website),
    accessHint: orNull(form.accessHint),
    careers: listFromText(form.careers),
    services: listFromText(form.services),
    usage: orNull(form.usage),
    imageUrl: orNull(form.imageUrl),
    parentPlaceId: form.parentPlaceId,
    isPublished: form.isPublished,
    verified: form.verified,
  }
}

const parse = (text: string) => (text.trim() === '' ? NaN : Number(text))

/** Mensajes de las coordenadas escritas; `undefined` si están bien o aún vacías (RF-31.23). */
export function coordinateErrors(form: Pick<PlaceForm, 'lat' | 'lng'>): { lat?: string; lng?: string } {
  const errors: { lat?: string; lng?: string } = {}
  const lat = parse(form.lat)
  const lng = parse(form.lng)
  if (form.lat.trim() !== '' && !Number.isFinite(lat)) errors.lat = 'Debe ser un número.'
  if (form.lng.trim() !== '' && !Number.isFinite(lng)) errors.lng = 'Debe ser un número.'
  if (Number.isFinite(lat) && Number.isFinite(lng) && !inPlaceArea(lat, lng)) {
    errors.lat = 'Ese punto está fuera del área del campus.'
  }
  return errors
}

/** Obligatorios completos y coordenadas dentro del área (RF-31.15). */
export function canSubmit(form: PlaceForm): boolean {
  return (
    form.name.trim() !== '' &&
    form.categoryId !== null &&
    inPlaceArea(parse(form.lat), parse(form.lng))
  )
}

/** ¿Hay cambios sin guardar? Compara campo por campo, sin contar espacios sobrantes (RF-31.19). */
export function isDirty(initial: PlaceForm, form: PlaceForm): boolean {
  return (Object.keys(initial) as (keyof PlaceForm)[]).some((key) => {
    const a = initial[key]
    const b = form[key]
    return typeof a === 'string' && typeof b === 'string' ? a.trim() !== b.trim() : a !== b
  })
}

/** El propio lugar y todos los que lo tienen (directa o indirectamente) como contenedor. */
export function descendantIds(places: Pick<AdminPlace, 'id' | 'parentPlaceId'>[], id: string): Set<string> {
  const excluded = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const p of places) {
      if (p.parentPlaceId && excluded.has(p.parentPlaceId) && !excluded.has(p.id)) {
        excluded.add(p.id)
        grew = true
      }
    }
  }
  return excluded
}
