// screens/MapScreen.jsx
import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import Constants from "expo-constants";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.mapboxPublicToken);

// Coordenadas del centro de la UNMSM
const UNMSM_CENTER = [-77.0842, -12.0566];

// Límites aproximados del campus (bounding box)
const CAMPUS_BOUNDS = {
  latMin: -12.063,
  latMax: -12.051,
  lngMin: -77.091,
  lngMax: -77.078,
};

function isInsideCampus(lat: number, lng: number) {
  return (
    lat >= CAMPUS_BOUNDS.latMin &&
    lat <= CAMPUS_BOUNDS.latMax &&
    lng >= CAMPUS_BOUNDS.lngMin &&
    lng <= CAMPUS_BOUNDS.lngMax
  );
}

export function MapScreen() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [showAvatar, setShowAvatar] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        // Criterio 3: GPS denegado, no se muestra el avatar, pero mapa sigue funcionando
        setShowAvatar(false);
        return;
      }
      console.log(
        "Simulación: GPS aceptado, mostrando avatar en ubicación simulada dentro del campus",
      );
      setUserLocation([-77.0842, -12.05]); // Simulación de ubicación dentro del campus
      setShowAvatar(true);

      // const location = await Location.getCurrentPositionAsync({});
      // const { latitude, longitude } = location.coords;
      // // Criterio 2: GPS aceptado y dentro del campus, se debe mostrar avatar
      // if (isInsideCampus(latitude, longitude)) {
      //   setUserLocation([longitude, latitude]);
      //   setShowAvatar(true);
      // }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/streets-v12"
      >
        {/* Criterio 1: Cámara siempre centrada en UNMSM al entrar */}
        <MapboxGL.Camera
          zoomLevel={15}
          centerCoordinate={UNMSM_CENTER}
          pitch={45} // Vista 3D
          animationMode="flyTo"
          animationDuration={1500}
        />

        {/* Criterio 2: Avatar solo si GPS aceptado y dentro del campus */}
        {showAvatar && userLocation && (
          <MapboxGL.PointAnnotation id="avatar" coordinate={userLocation}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "red",
                overflow: "hidden",
              }}
            >
              <Text style={{ fontSize: 34 }}>👨‍🏫</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  avatar: {
    width: 106,
    height: 106,
    borderRadius: 18,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
});
