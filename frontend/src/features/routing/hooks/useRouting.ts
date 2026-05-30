import { useState } from 'react';
import { useMapStore } from '../../../core/store/useMapStore';
import { campusPathfinder } from '../utils/pathfinder';

export function useRouting() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setActiveRoute = useMapStore((state) => state.setActiveRoute);
  const clearRoute = useMapStore((state) => state.clearRoute);

  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    setIsCalculating(true);
    setError(null);
    try {
      // Pequeña latencia asíncrona simulada para que la UI no se trabe de golpe si el grafo crece
      await new Promise(resolve => setTimeout(resolve, 10));

      const pathCoords = campusPathfinder.findShortestPath(start, end);

      if (pathCoords && pathCoords.length > 0) {
        // Convertimos el array de tuplas [lon, lat] a objetos Coordinate
        const coords = pathCoords.map((c: [number, number]) => ({
          longitude: c[0],
          latitude: c[1]
        }));
        
        setActiveRoute(coords);
        return coords;
      } else {
        throw new Error('No route found');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Routing error:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    calculateRoute,
    clearRoute,
    isCalculating,
    error,
  };
}
