import { create } from 'zustand';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteMetadata {
  startName: string;
  endName: string;
  distance: number;
}

interface MapState {
  userLocation: Coordinate | null;
  userHeading: number;
  activeRoute: Coordinate[];
  routeMetadata: RouteMetadata | null;
  isRouteActive: boolean;
  mapMode: 'free' | 'guide';
  /** Lugar al que debe centrarse el mapa (p. ej. al abrirlo desde el chat). */
  focusTarget: Coordinate | null;
  setUserLocation: (coord: Coordinate) => void;
  setUserHeading: (heading: number) => void;
  setActiveRoute: (coords: Coordinate[], metadata?: RouteMetadata | null) => void;
  clearRoute: () => void;
  setMapMode: (mode: 'free' | 'guide') => void;
  setFocusTarget: (coord: Coordinate) => void;
  clearFocusTarget: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  userHeading: 0,
  activeRoute: [],
  routeMetadata: null,
  isRouteActive: false,
  mapMode: 'free',
  focusTarget: null,
  setUserLocation: (coord) => set({ userLocation: coord }),
  setUserHeading: (heading) => set({ userHeading: heading }),
  setActiveRoute: (coords, metadata = null) =>
    set({ activeRoute: coords, routeMetadata: metadata, isRouteActive: coords.length > 0 }),
  clearRoute: () => set({ activeRoute: [], routeMetadata: null, isRouteActive: false }),
  setMapMode: (mode) => set({ mapMode: mode }),
  setFocusTarget: (coord) => set({ focusTarget: coord }),
  clearFocusTarget: () => set({ focusTarget: null }),
}));
