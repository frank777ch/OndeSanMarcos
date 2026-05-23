import { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import Constants from "expo-constants";

import { MapSearchBar } from "../components/MapSearchBar";
import { MapFilterChips } from "../components/MapFilterChips";
import { UNMSM, UNMSM_POIS } from "../constants/unmsm";
import { MapLocationButton } from "../components/MapLocationButton";
import { MapActionButtons } from "../components/MapActionButtons";
import { useMapCamera } from "../hooks/useMapCamera";
import { MapSpawnModal } from "../components/MapSpawnModal";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.mapboxPublicToken);

export function MapScreen() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [showAvatar, setShowAvatar] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // --- NUEVA LÓGICA DE ESTADOS Y CÁMARA ---
  const [appMode, setAppMode] = useState<"ninguno" | "libre" | "guia">(
    "ninguno",
  );
  const [isSpawnModalVisible, setIsSpawnModalVisible] = useState(false);
  const { cameraRef, cameraConfig, goToDefaultMode, goToFreeMode } =
    useMapCamera();

  // Esta función reacciona cuando tocas los botones morados
  const handleModeToggle = (modo: "ninguno" | "libre" | "guia") => {
    if (modo === "libre") {
      // En vez de volar directo, ¡abrimos el modal!
      setIsSpawnModalVisible(true);
    } else if (modo === "ninguno") {
      setAppMode("ninguno");
      goToDefaultMode();
    } else {
      setAppMode(modo);
    }
  };

  const handleSpawnSelection = (coords: [number, number]) => {
    setIsSpawnModalVisible(false); // Cerramos el modal
    setAppMode("libre"); // Activamos el estado libre
    goToFreeMode(coords); // ¡Volamos a la coordenada elegida!
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setShowAvatar(false);
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
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 10000),
        );

        const location = await Promise.race([locationPromise, timeoutPromise]);
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

  // @ts-ignore
  const pointsFeatures = UNMSM_POIS.features.filter(
    (f) => f.geometry.type === "Point",
  );
  // @ts-ignore
  const routeFeatures = UNMSM_POIS.features.filter(
    (f) => f.geometry.type === "LineString",
  );

  const filteredPoints = {
    type: "FeatureCollection",
    // @ts-ignore
    features: activeCategory
      ? pointsFeatures.filter((f) => f.properties?.categoria === activeCategory)
      : [],
  };

  const routeData = { type: "FeatureCollection", features: routeFeatures };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/streets-v12"
      >
        {/* --- CÁMARA AHORA CONTROLADA POR EL HOOK --- */}
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={cameraConfig.zoomLevel}
          centerCoordinate={cameraConfig.centerCoordinate}
          pitch={cameraConfig.pitch}
          animationMode={cameraConfig.animationMode as any}
          animationDuration={cameraConfig.animationDuration}
        />

        <MapboxGL.VectorSource
          id="composite"
          url="mapbox://mapbox.mapbox-streets-v8"
        >
          <MapboxGL.FillExtrusionLayer
            id="3d-buildings"
            sourceLayerID="building"
            filter={["==", "extrude", "true"]}
            style={{
              fillExtrusionColor: "#e0e0e0",
              fillExtrusionHeight: ["get", "height"],
              fillExtrusionBase: ["get", "min_height"],
              fillExtrusionOpacity: 0.9,
            }}
          />
        </MapboxGL.VectorSource>

        <MapboxGL.ShapeSource id="route-source" shape={routeData as any}>
          <MapboxGL.LineLayer
            id="route-line"
            style={{
              lineColor: "#512DA8",
              lineWidth: 5,
              lineJoin: "round",
              lineCap: "round",
            }}
          />
        </MapboxGL.ShapeSource>

        <MapboxGL.ShapeSource id="poi-source" shape={filteredPoints as any}>
          <MapboxGL.CircleLayer
            id="poi-circles"
            style={{
              circleRadius: 8,
              circleColor: "#E74C3C",
              circleStrokeWidth: 2,
              circleStrokeColor: "#FFFFFF",
            }}
          />
          <MapboxGL.SymbolLayer
            id="poi-text"
            style={{
              textField: ["get", "nombre"],
              textSize: 12,
              textOffset: [0, 1.2],
              textAnchor: "top",
              textColor: "#000000",
              textHaloColor: "#FFFFFF",
              textHaloWidth: 1,
            }}
          />
        </MapboxGL.ShapeSource>

        {showAvatar && userLocation && (
          <MapboxGL.PointAnnotation id="avatar" coordinate={userLocation}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
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

      <MapSearchBar />

      <MapFilterChips
        activeFilter={activeCategory}
        onFilterChange={(categoria) =>
          setActiveCategory((prev) => (prev === categoria ? null : categoria))
        }
      />

      <MapLocationButton />
      {/* --- LE PASAMOS LA FUNCIÓN A TUS BOTONES MORADOS --- */}
      <MapActionButtons onModeSelect={handleModeToggle} />

      <MapSpawnModal
        visible={isSpawnModalVisible}
        onClose={() => setIsSpawnModalVisible(false)}
        onSelectPoint={handleSpawnSelection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "red",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});
