import type { LngLat } from './constants/campus'

/** Identificador de una categoría de lugares (por ejemplo `facultades`). Lo define la base de datos. */
export type PlaceCategoryId = string

export interface PlaceCategory {
  id: PlaceCategoryId
  label: string
  /** Color del punto en el mapa, `#RRGGBB`. */
  color: string
}

/**
 * Lugar del campus tal como lo usa la web. Viene de `GET /api/places` (HU-27):
 * `placesApi` convierte `lat`/`lng` a `coordinates` y deja sin definir lo que no tiene valor.
 */
export interface Place {
  /** Slug estable, por ejemplo `fisi`. */
  id: string
  name: string
  shortName?: string
  category: PlaceCategoryId
  /** [lng, lat] */
  coordinates: LngLat
  /** Palabras o siglas con las que también se puede buscar el lugar. */
  keywords: string[]
  // Datos de la ficha. Todos son opcionales: hay lugares sin información
  // (puertas, canchas) que solo muestran nombre y categoría.
  /** Horario resumido, ej. «Lun–Vie 8:00–16:00». */
  schedule?: string
  description?: string
  phone?: string
  annex?: string
  email?: string
  website?: string
  /** Cómo llegar o puerta más cercana. */
  accessHint?: string
  careers?: string[]
  services?: string[]
  /** Para qué se usa el lugar (auditorios). */
  usage?: string
  /** Un tramo de horario por línea. */
  detailedSchedule?: string[]
  imageUrl?: string
  /** Lugar que lo contiene (un auditorio dentro de una facultad). */
  parentPlaceId?: string
  /** Cuándo se confirmó el dato con la universidad; sin valor = sin verificar. */
  verifiedAt?: string
}
