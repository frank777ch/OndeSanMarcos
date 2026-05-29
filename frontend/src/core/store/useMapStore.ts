import { create } from 'zustand';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapState {
  userLocation: Coordinate | null;
  userHeading: number;
  activeRoute: Coordinate[];
  isRouteActive: boolean;
  mapMode: 'free' | 'guide';
  /** Lugar al que debe centrarse el mapa (p. ej. al abrirlo desde el chat). */
  focusTarget: Coordinate | null;
  setUserLocation: (coord: Coordinate) => void;
  setUserHeading: (heading: number) => void;
  setActiveRoute: (coords: Coordinate[]) => void;
  clearRoute: () => void;
  setMapMode: (mode: 'free' | 'guide') => void;
  setFocusTarget: (coord: Coordinate) => void;
  clearFocusTarget: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  userHeading: 0,
  activeRoute: [],
  isRouteActive: false,
  mapMode: 'free',
  focusTarget: null,
  setUserLocation: (coord) => set({ userLocation: coord }),
  setUserHeading: (heading) => set({ userHeading: heading }),
  setActiveRoute: (coords) =>
    set({ activeRoute: coords, isRouteActive: coords.length > 0 }),
  clearRoute: () => set({ activeRoute: [], isRouteActive: false }),
  setMapMode: (mode) => set({ mapMode: mode }),
  setFocusTarget: (coord) => set({ focusTarget: coord }),
  clearFocusTarget: () => set({ focusTarget: null }),
}));
