import { useEffect, useState } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import * as Location from "expo-location";

import { isInsideCampus } from "../utils/geofence";

export function useLocationPermission() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [showAvatar, setShowAvatar] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== "granted") {
        setShowAvatar(false);
        if (Platform.OS === "android") {
          ToastAndroid.show(
            "Activa el permiso de ubicación para ver tu posición en el mapa.",
            ToastAndroid.SHORT,
          );
        } else {
          Alert.alert(
            "Permiso de ubicación denegado",
            "Actívalo para ver tu posición en el mapa.",
          );
        }
        return;
      }

      try {
        // Intenta primero con la última posición conocida (respuesta inmediata)
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          const { latitude, longitude } = lastKnown.coords;
          if (isInsideCampus(latitude, longitude)) {
            setUserLocation([longitude, latitude]);
            setShowAvatar(true);
          }
        }

        // Luego obtiene posición actual con timeout de 10 segundos
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        let timeoutId: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => resolve(null), 10000);
        });

        const location = await Promise.race([locationPromise, timeoutPromise]);
        clearTimeout(timeoutId!);
        if (!location) {
          console.warn(
            "GPS timeout: no se pudo obtener posición en 10s. Configura las coordenadas en el emulador (Extended Controls → Location).",
          );
          return;
        }

        const { latitude, longitude } = location.coords;
        // Criterio 2: GPS aceptado y dentro del campus, se debe mostrar avatar
        if (isInsideCampus(latitude, longitude)) {
          setUserLocation([longitude, latitude]);
          setShowAvatar(true);
        } else {
          //mostrar ubicacion del usuarioo en consola
          console.warn("Usuario fuera, posicion actual: ", latitude, longitude);
          setUserLocation([longitude, latitude]);
          setShowAvatar(true);
        }
      } catch (error) {
        console.error("Error obteniendo ubicación:", error);
      }
    })();
  }, []);

  return {
    userLocation,
    setUserLocation,
    showAvatar,
    setShowAvatar,
    permissionStatus,
  };
}
