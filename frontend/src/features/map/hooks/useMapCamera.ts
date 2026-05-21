import { useState, useRef } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { UNMSM } from '../constants/unmsm';

// Definimos la estructura de nuestra configuración de cámara
interface CameraState {
  centerCoordinate: [number, number];
  zoomLevel: number;
  pitch: number;
  animationMode: 'flyTo' | 'moveTo' | 'easeTo' | 'none';
  animationDuration: number;
}

export function useMapCamera() {
  // Referencia directa a la cámara de Mapbox (por si luego necesitamos funciones avanzadas)
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // El estado inicial (Modo Ninguno / Vista Pájaro)
  const [cameraConfig, setCameraConfig] = useState<CameraState>({
    centerCoordinate: [UNMSM.center.longitude, UNMSM.center.latitude],
    zoomLevel: UNMSM.camera.zoomLevel, // 16
    pitch: UNMSM.camera.pitch, // 60
    animationMode: 'flyTo',
    animationDuration: 1500,
  });

  // Función 1: Volver a la vista general desde arriba
  const goToDefaultMode = () => {
    setCameraConfig({
      centerCoordinate: [UNMSM.center.longitude, UNMSM.center.latitude],
      zoomLevel: UNMSM.camera.zoomLevel,
      pitch: UNMSM.camera.pitch,
      animationMode: 'flyTo',
      animationDuration: 2000, // 2 segundos de vuelo suave hacia arriba
    });
  };

  // Función 2: Bajar al "Modo Libre" (Street View)
  const goToFreeMode = (spawnCoordinate: [number, number]) => {
    setCameraConfig({
      centerCoordinate: spawnCoordinate,
      zoomLevel: 19.5, // Súper cerca del piso
      pitch: 80, // Mirando hacia el horizonte
      animationMode: 'flyTo',
      animationDuration: 2500, // Vuelo de inmersión tipo película
    });
  };

  // Función 3: Caminar (Navegar de un punto a otro en el Modo Libre)
  const moveToPoint = (newCoordinate: [number, number]) => {
    setCameraConfig((prev) => ({
      ...prev,
      centerCoordinate: newCoordinate,
      animationDuration: 800,
    }));
  };

  return {
    cameraRef,
    cameraConfig,
    goToDefaultMode,
    goToFreeMode,
    moveToPoint,
  };
}