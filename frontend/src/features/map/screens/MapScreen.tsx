import { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
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
import { useMapStore } from "@store/useMapStore";

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.mapboxPublicToken);

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);

  const [appMode, setAppMode] = useState<"ninguno" | "libre" | "guia">(
    "ninguno",
  );
  const [isSpawnModalVisible, setIsSpawnModalVisible] = useState(false);
  const { cameraRef, cameraConfig, goToDefaultMode, goToFreeMode, moveToPoint } =
    useMapCamera();

  // Destino solicitado desde fuera del mapa (chat o botón "Abrir"): HU-2.3.
  const focusTarget = useMapStore((s) => s.focusTarget);
  const clearFocusTarget = useMapStore((s) => s.clearFocusTarget);

  // Timer para detectar cuándo el usuario dejó de arrastrar el mapa
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se llama en cada frame mientras la cámara se mueve (usuario arrastrando)
  const handleCameraChanged = () => {
    if (appMode !== "libre") return;

    // El usuario está moviendo el mapa → animación de caminar
    setIsWalking(true);

    // Reinicia el timer: si no hay movimiento en 600ms → vuelve a idle
    if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    walkTimerRef.current = setTimeout(() => {
      setIsWalking(false);
    }, 600);
  };

  const handleModeToggle = (modo: "ninguno" | "libre" | "guia") => {
    if (modo === "libre") {
      setIsSpawnModalVisible(true);
    } else if (modo === "ninguno") {
      setIsWalking(false);
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      setAppMode("ninguno");
      goToDefaultMode();
    } else {
      setAppMode(modo);
    }
  };

  const handleSpawnSelection = (coords: [number, number]) => {
    setIsSpawnModalVisible(false);
    setAppMode("libre");
    setUserLocation(coords);
    setShowAvatar(true);
    goToFreeMode(coords);
  };

  // Centra la cámara cuando alguien (chat o "Abrir" en una LocationCard)
  // escribe un destino en useMapStore.focusTarget. Cierra HU-2.3.
  // moveToPoint no está memoizado en useMapCamera; lo omitimos de las deps a
  // propósito para evitar disparos en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!focusTarget) return;
    moveToPoint([focusTarget.longitude, focusTarget.latitude]);
    clearFocusTarget();
  }, [focusTarget, clearFocusTarget]);

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

    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    };
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

  const shouldShowAvatar =
    showAvatar && userLocation !== null && appMode === "libre";

  const avatarSource = isWalking
    ? require("../../../../assets/avatar/david_walk.webp")
    : require("../../../../assets/avatar/david_idle.webp");

  return (
    <View style={styles.container}>
      {/* ── CAPA 1: MAPA ── */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/streets-v12"
        zoomEnabled={appMode !== "libre"}
        pitchEnabled={appMode !== "libre"}
        // Detecta cualquier movimiento de cámara (arrastre del usuario)
        onCameraChanged={handleCameraChanged}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={cameraConfig.zoomLevel}
          centerCoordinate={cameraConfig.centerCoordinate}
          pitch={cameraConfig.pitch}
          heading={cameraConfig.heading}
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

      {/* ── CAPA 2: AVATAR FLOTANTE ── */}
      {shouldShowAvatar && (
        <View style={styles.avatarOverlay} pointerEvents="none">
          <Image
            source={avatarSource}
            style={styles.avatarImage}
            contentFit="contain"
          />
        </View>
      )}

      {/* ── CAPA 3: UI ── */}
      <MapSearchBar />
      <MapFilterChips
        activeFilter={activeCategory}
        onFilterChange={(categoria) =>
          setActiveCategory((prev) => (prev === categoria ? null : categoria))
        }
      />
      <MapLocationButton />
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

  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: 120,
    height: 120,
    marginTop: 120,
  },
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
