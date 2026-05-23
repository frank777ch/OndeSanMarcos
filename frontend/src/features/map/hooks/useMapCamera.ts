import { useState, useRef } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { UNMSM } from '../constants/unmsm';

interface CameraState {
  centerCoordinate: [number, number];
  zoomLevel: number;
  pitch: number;
  heading?: number; // <--- NUEVO: Control de rotación
  animationMode: 'flyTo' | 'moveTo' | 'easeTo' | 'none';
  animationDuration: number;
}

export function useMapCamera() {
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const [cameraConfig, setCameraConfig] = useState<CameraState>({
    centerCoordinate: [UNMSM.center.longitude, UNMSM.center.latitude],
    zoomLevel: UNMSM.camera.zoomLevel,
    pitch: UNMSM.camera.pitch,
    heading: 0, // Por defecto mirando al Norte
    animationMode: 'flyTo',
    animationDuration: 1500,
  });

  const goToDefaultMode = () => {
    setCameraConfig({
      centerCoordinate: [UNMSM.center.longitude, UNMSM.center.latitude],
      zoomLevel: UNMSM.camera.zoomLevel,
      pitch: UNMSM.camera.pitch,
      heading: 0, // Que vuelva a mirar al norte al salir
      animationMode: 'flyTo',
      animationDuration: 2000,
    });
  };

  const goToFreeMode = (spawnCoordinate: [number, number]) => {
    setCameraConfig({
      centerCoordinate: spawnCoordinate,
      zoomLevel: 21, // <--- BLOQUEADO CERCANO
      pitch: 80,       // <--- BLOQUEADO PICADO
      heading: 0,      // <--- MIRANDO AL NORTE AL INICIAR
      animationMode: 'flyTo',
      animationDuration: 2500,
    });
  };

  const moveToPoint = (newCoordinate: [number, number]) => {
    setCameraConfig((prev) => ({
      ...prev,
      centerCoordinate: newCoordinate,
      // <--- 1000ms da la sensación de caminar en lugar de teletransportarse
      animationDuration: 1000, 
    }));
  };

  return { cameraRef, cameraConfig, goToDefaultMode, goToFreeMode, moveToPoint };
}