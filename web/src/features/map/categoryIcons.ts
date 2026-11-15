import {
  Bed, Bike, BookOpen, Briefcase, Bus, Camera, Car, Church, CircleParking, Coffee, ConciergeBell,
  Droplets, DoorOpen, Dumbbell, FlaskConical, GraduationCap, HeartPulse, Hospital, Info, Landmark,
  Library, MapPin, Microscope, Mic, Monitor, Music, Palette, Pill, Printer, School, Shapes, Shield,
  ShoppingBag, Stethoscope, Store, Theater, Toilet, Trees, Trophy, Users, Utensils, UtensilsCrossed,
  Wifi, Wrench, Zap, Building2,
  type LucideIcon,
} from 'lucide-react'

/** Ícono que usa una categoría sin ícono o con un nombre desconocido. */
export const DEFAULT_CATEGORY_ICON = 'map-pin'

/**
 * Íconos que se pueden asignar a una categoría, por nombre (kebab-case, el que guarda el backend).
 * La misma lista vive en `backend/app/places/icons.py`; si se agrega uno, va en los dos.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'map-pin': MapPin,
  'graduation-cap': GraduationCap,
  'utensils-crossed': UtensilsCrossed,
  theater: Theater,
  trophy: Trophy,
  'door-open': DoorOpen,
  briefcase: Briefcase,
  stethoscope: Stethoscope,
  wrench: Wrench,
  shapes: Shapes,
  'building-2': Building2,
  coffee: Coffee,
  mic: Mic,
  dumbbell: Dumbbell,
  landmark: Landmark,
  'heart-pulse': HeartPulse,
  'concierge-bell': ConciergeBell,
  'book-open': BookOpen,
  library: Library,
  'flask-conical': FlaskConical,
  microscope: Microscope,
  bus: Bus,
  car: Car,
  bike: Bike,
  'circle-parking': CircleParking,
  trees: Trees,
  church: Church,
  hospital: Hospital,
  store: Store,
  'shopping-bag': ShoppingBag,
  pill: Pill,
  wifi: Wifi,
  printer: Printer,
  monitor: Monitor,
  music: Music,
  palette: Palette,
  users: Users,
  shield: Shield,
  info: Info,
  toilet: Toilet,
  school: School,
  utensils: Utensils,
  bed: Bed,
  droplets: Droplets,
  zap: Zap,
  camera: Camera,
}

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS)

/** Ícono de una categoría; un nombre desconocido usa el ícono por defecto. */
export function getCategoryIcon(name: string | undefined): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || CATEGORY_ICONS[DEFAULT_CATEGORY_ICON]
}
