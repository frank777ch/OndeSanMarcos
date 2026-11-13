import { usePlacesStore } from '@/features/map/store/usePlacesStore'
import type { Place, PlaceCategory } from '@/features/map/types'

/** Id numérico de una categoría de ejemplo, a partir de su slug. */
const CATEGORY_IDS: Record<string, number> = {
  facultades: 1, cafeterias: 2, auditorios: 3, 'campos-deportivos': 4, puertas: 5, administracion: 6, servicios: 8, otros: 9,
  salud: 7,
}
export function catId(slug: string): number {
  return (CATEGORY_IDS[slug] ??= 100 + Object.keys(CATEGORY_IDS).length)
}

/** Categorías de ejemplo, en el orden de la API. */
export const CATEGORIES: PlaceCategory[] = [
  { id: catId('facultades'), slug: 'facultades', label: 'Facultades', color: '#3056ac' },
  { id: catId('cafeterias'), slug: 'cafeterias', label: 'Cafeterías', color: '#ff8f10' },
  { id: catId('auditorios'), slug: 'auditorios', label: 'Auditorios', color: '#8e44ad' },
  { id: catId('campos-deportivos'), slug: 'campos-deportivos', label: 'Campos deportivos', color: '#2e9e57' },
  { id: catId('puertas'), slug: 'puertas', label: 'Puertas', color: '#e74c3c' },
  { id: catId('administracion'), slug: 'administracion', label: 'Administración', color: '#00838f' },
  { id: catId('servicios'), slug: 'servicios', label: 'Servicios', color: '#6d4c41' },
  // Sin lugares en las fixtures: sirve para probar que no se muestra (RF-28.8).
  { id: catId('otros'), slug: 'otros', label: 'Otros', color: '#757575' },
]

/** Lugares de ejemplo con coordenadas reales del campus (los usa el cálculo de rutas). */
export const PLACES: Place[] = [
  { id: 1, slug: 'puerta-3', name: 'Puerta 3', category: catId('puertas'), coordinates: [-77.08001732406147, -12.057136012331654], keywords: [] },
  { id: 2, slug: 'puerta-2', name: 'Puerta 2', category: catId('puertas'), coordinates: [-77.07936395135454, -12.059496369475596], keywords: [] },
  {
    id: 3, slug: 'fisi',
    name: 'Facultad de Ingeniería de Sistemas e Informática (FISI)',
    category: catId('facultades'),
    coordinates: [-77.0857217, -12.0535548],
    keywords: ['fisi', 'sistemas', 'ingenieria de sistemas', 'informatica', 'software'],
    schedule: 'Lun–Sáb 8:00–22:00',
    description: 'Una de las mejores facultades de informática del Perú.',
    phone: '619-7000',
    careers: ['Ingeniería de Sistemas', 'Ingeniería de Software'],
  },
  {
    id: 4, slug: 'facultad-de-ingenieria-civil',
    name: 'Facultad de Ingeniería Civil',
    category: catId('facultades'),
    coordinates: [-77.0847, -12.0551],
    keywords: ['civil'],
    schedule: 'Lun–Sáb 8:00–22:00',
  },
  {
    id: 5, slug: 'facultad-de-psicologia',
    name: 'Facultad de Psicología',
    category: catId('facultades'),
    coordinates: [-77.0867638, -12.0535766],
    keywords: ['psicologia', 'psicologo', 'facultad de psicologia', 'conducta'],
    schedule: 'Lun–Sáb 8:00–22:00',
  },
  {
    id: 6, slug: 'facultad-de-ciencias-sociales',
    name: 'Facultad de Ciencias Sociales',
    category: catId('facultades'),
    coordinates: [-77.0816666, -12.0579798],
    keywords: ['ciencias sociales', 'sociologia', 'antropologia', 'trabajo social'],
    schedule: 'Lun–Sáb 8:00–22:00',
  },
  {
    id: 7, slug: 'facultad-de-educacion',
    name: 'Facultad de Educación',
    category: catId('facultades'),
    coordinates: [-77.0851319, -12.0554579],
    keywords: ['educacion', 'pedagogia', 'docente', 'ensenanza'],
    schedule: 'Lun–Sáb 8:00–22:00',
  },
  {
    id: 8, slug: 'derecho',
    name: 'Facultad de Derecho y Ciencia Política',
    category: catId('facultades'),
    coordinates: [-77.080267, -12.058368],
    keywords: ['derecho', 'ciencia politica', 'abogado', 'leyes'],
    schedule: 'Lun–Sáb 8:00–22:00',
  },
  {
    id: 9, slug: 'facultad-de-ciencias-biologicas',
    name: 'Facultad de Ciencias Biológicas',
    category: catId('facultades'),
    coordinates: [-77.08205978986605, -12.0596728770671],
    keywords: ['biologia', 'biologicas', 'ciencias biologicas', 'microbiologia'],
    schedule: 'Lun–Sáb 8:00–22:00',
  },
  { id: 10, slug: 'puerta-1', name: 'Puerta 1', category: catId('puertas'), coordinates: [-77.08583596979169, -12.060949126150703], keywords: [] },
  {
    id: 11, slug: 'facultad-de-ciencias-fisicas',
    name: 'Facultad de Ciencias Físicas',
    category: catId('facultades'),
    coordinates: [-77.0818206, -12.0595585],
    keywords: ['fisica', 'ciencias fisicas', 'astrofisica'],
  },
  {
    id: 12, slug: 'oca',
    name: 'Oficina Central de Admisión (OCA)',
    category: catId('administracion'),
    coordinates: [-77.085374, -12.05201],
    keywords: ['oca', 'admision', 'postulante'],
    schedule: 'Lun–Vie 9:00–16:00',
  },
  {
    id: 13, slug: 'facultad-de-ciencias-economicas-antiguo',
    name: 'Facultad de Ciencias Economicas (Antiguo)',
    category: catId('facultades'),
    coordinates: [-77.0811987, -12.0580466],
    keywords: ['economia', 'economicas'],
  },
  {
    id: 14, slug: 'facultad-de-ciencias-economicas-nuevo',
    name: 'Facultad de Ciencias Economicas (Nuevo)',
    category: catId('facultades'),
    coordinates: [-77.086256, -12.0534471],
    keywords: ['economia', 'economicas'],
  },
  {
    id: 15, slug: 'cafeteria-de-la-facultad-de-odontologia',
    name: 'Cafetería de la Facultad de Odontología',
    category: catId('cafeterias'),
    coordinates: [-77.08514887439485, -12.054603716785754],
    keywords: ['cafeteria', 'odontologia', 'comida'],
    schedule: 'Lun–Sáb 9:00–20:00',
    services: ['Venta de alimentos', 'Snacks', 'Bebidas'],
  },
  {
    id: 16, slug: 'auditorio-rosa-alarco-larraburre',
    name: 'Auditorio Rosa Alarco Larraburre',
    category: catId('auditorios'),
    coordinates: [-77.08521854944695, -12.055838267297563],
    keywords: ['auditorio', 'rosa alarco', 'eventos'],
    schedule: 'Según programación de eventos',
    usage: 'Conferencias, charlas, seminarios y eventos de escala mediana.',
  },
  {
    id: 17, slug: 'gimnasio-universitario',
    name: 'Gimnasio Universitario',
    category: catId('campos-deportivos'),
    coordinates: [-77.084403, -12.05964],
    keywords: ['gimnasio', 'gym', 'pesas'],
    schedule: 'Lun–Vie 6:00–20:00 · Sáb 8:00–16:30',
  },
  {
    id: 18, slug: 'biblioteca-central',
    name: 'Biblioteca Central Pedro Zulen',
    category: catId('servicios'),
    coordinates: [-77.085872, -12.055881],
    keywords: ['biblioteca', 'biblioteca central', 'pedro zulen', 'libros', 'tesis'],
    schedule: 'Lun–Sáb 8:00–20:00 · Requiere carné de biblioteca',
    detailedSchedule: ['Requiere carné de biblioteca'],
    description: 'La biblioteca universitaria más grande del Perú.',
    phone: '619-7000',
    annex: '7701',
  },
]

/** Id numérico de una fixture a partir de su slug (los tests no dependen de números fijos). */
export function idOf(slug: string): number {
  const place = PLACES.find((p) => p.slug === slug)
  if (!place) throw new Error(`No hay una fixture con el slug ${slug}`)
  return place.id
}

/** Llena el store de lugares con las fixtures (o con las que se pasen), ya en estado `ready`. */
export function seedPlaces(places: Place[] = PLACES, categories: PlaceCategory[] = CATEGORIES): void {
  usePlacesStore.setState({
    status: 'ready',
    places,
    categories,
    byId: Object.fromEntries(places.map((p) => [p.id, p])),
    bySlug: Object.fromEntries(places.map((p) => [p.slug, p])),
  })
}

/** Deja el store como al abrir la web, antes de cargar. */
export function resetPlaces(): void {
  usePlacesStore.setState({ status: 'idle', places: [], byId: {}, bySlug: {}, categories: [] })
}
