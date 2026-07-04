import { create } from 'zustand';

interface Coordinate {
  latitude: number;
  longitude: number;
}

/** Punto al que enfocar el mapa. Si drawRoute=true, además traza la ruta. */
export interface FocusTarget {
  latitude: number;
  longitude: number;
  name?: string;
  drawRoute?: boolean;
}

interface RouteMetadata {
  startName: string;
  endName: string;
  distance: number;
}

export interface PlaceInfo {
  id: string;
  name: string;
  schedule?: string;
  latitude: number;
  longitude: number;
  description?: string;
  phone?: string;
  annex?: string;
  careers?: string[];
  usage?: string;
  services?: string[];
  detailedSchedule?: string[];
  keywords?: string[];
}

interface MapState {
  userLocation: Coordinate | null;
  userHeading: number;
  activeRoute: Coordinate[];
  routeMetadata: RouteMetadata | null;
  isRouteActive: boolean;
  mapMode: 'free' | 'guide';
  /** Modo guía activo: la cámara sigue al usuario por la ruta en tiempo real. */
  guideActive: boolean;
  /** Distancia restante (m) hasta el destino siguiendo la ruta; null si no se navega. */
  remainingDistance: number | null;
  /** Lugar al que debe centrarse el mapa (p. ej. al abrirlo desde el chat). */
  focusTarget: FocusTarget | null;
  focusedPlace: PlaceInfo | null;
  setUserLocation: (coord: Coordinate) => void;
  setUserHeading: (heading: number) => void;
  setActiveRoute: (coords: Coordinate[], metadata?: RouteMetadata | null) => void;
  clearRoute: () => void;
  setMapMode: (mode: 'free' | 'guide') => void;
  startGuide: () => void;
  stopGuide: () => void;
  setRemainingDistance: (meters: number | null) => void;
  setFocusTarget: (target: FocusTarget) => void;
  clearFocusTarget: () => void;
  setFocusedPlace: (place: PlaceInfo | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  userHeading: 0,
  activeRoute: [],
  routeMetadata: null,
  isRouteActive: false,
  mapMode: 'free',
  guideActive: false,
  remainingDistance: null,
  focusTarget: null,
  focusedPlace: null,
  setUserLocation: (coord) => set({ userLocation: coord }),
  setUserHeading: (heading) => set({ userHeading: heading }),
  setActiveRoute: (coords, metadata = null) =>
    set({ activeRoute: coords, routeMetadata: metadata, isRouteActive: coords.length > 0 }),
  clearRoute: () =>
    set({ activeRoute: [], routeMetadata: null, isRouteActive: false, remainingDistance: null }),
  setMapMode: (mode) => set({ mapMode: mode }),
  startGuide: () => set({ guideActive: true }),
  stopGuide: () => set({ guideActive: false, remainingDistance: null }),
  setRemainingDistance: (meters) => set({ remainingDistance: meters }),
  setFocusTarget: (target) => set({ focusTarget: target }),
  clearFocusTarget: () => set({ focusTarget: null }),
  setFocusedPlace: (place) => set({ focusedPlace: place }),
}));
