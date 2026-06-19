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
      zoomLevel: 21,
      pitch: 80,
      heading: 0,
      animationMode: 'flyTo',
      animationDuration: 2500,
    });
  };

  const goToRoutePreview = (startCoordinate: [number, number]) => {
    setCameraConfig({
      centerCoordinate: startCoordinate,
      zoomLevel: 17,
      pitch: 40,
      heading: 0,
      animationMode: 'flyTo',
      animationDuration: 1500,
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

  const goToGuideMode = (currentCoordinate: [number, number]) => {
    setCameraConfig({
      centerCoordinate: currentCoordinate,
      zoomLevel: 18,
      pitch: 60,
      heading: 0,
      animationMode: 'flyTo',
      animationDuration: 2000,
    });
  };

  const setHeading = (heading: number) => {
    setCameraConfig((prev) => ({
      ...prev,
      heading,
      animationDuration: 500,
    }));
  };

  return { cameraRef, cameraConfig, goToDefaultMode, goToFreeMode, goToRoutePreview, goToGuideMode, moveToPoint, setHeading };
}