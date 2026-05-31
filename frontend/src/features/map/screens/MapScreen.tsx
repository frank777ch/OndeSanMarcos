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
import { MapRouteSelectionModal } from "../components/MapRouteSelectionModal";
import { useMapStore } from "../../../core/store/useMapStore";
import { useRouting } from "../../routing/hooks/useRouting";
import { MapRouteInfoCard } from "../components/MapRouteInfoCard";
import { Ionicons } from "@expo/vector-icons";
import { MapPin } from "lucide-react-native";
import { useThemeStore } from "../../../core/store/useThemeStore";

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
  const [isRouteSelectionVisible, setIsRouteSelectionVisible] = useState(false);
  const {
    cameraRef,
    cameraConfig,
    goToDefaultMode,
    goToFreeMode,
    goToGuideMode,
    moveToPoint,
    setHeading,
  } = useMapCamera();

  const activeRoute = useMapStore((state) => state.activeRoute);
  const isRouteActive = useMapStore((state) => state.isRouteActive);
  const clearRouteStore = useMapStore((state) => state.clearRoute);
  const { calculateRoute, clearRoute, isCalculating } = useRouting();

  const primaryColor = useThemeStore((s) => s.primaryColor);
  const routeMetadata = useMapStore((s) => s.routeMetadata);

  // Destino solicitado desde fuera del mapa (chat o botón "Abrir"): HU-2.3.
  const focusTarget = useMapStore((s) => s.focusTarget);
  const clearFocusTarget = useMapStore((s) => s.clearFocusTarget);

  // Timer para detectar cuándo el usuario dejó de arrastrar el mapa
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const isFollowingUserRef = useRef(true);

  // Se llama en cada frame mientras la cámara se mueve (usuario arrastrando)
  const handleCameraChanged = (e: any) => {
    if (e.properties && e.properties.isUserInteraction) {
      if (appMode === "guia") {
        setIsFollowingUser(false);
        isFollowingUserRef.current = false;
      }

      if (appMode === "libre") {
        // El usuario está moviendo el mapa → animación de caminar
        setIsWalking(true);

        // Reinicia el timer: si no hay movimiento en 600ms → vuelve a idle
        if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
        walkTimerRef.current = setTimeout(() => {
          setIsWalking(false);
        }, 600);
      }
    }
  };

  const handleModeToggle = (modo: "ninguno" | "libre" | "guia") => {
    if (modo === "libre") {
      setIsSpawnModalVisible(true);
    } else if (modo === "ninguno") {
      setIsWalking(false);
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      setAppMode("ninguno");
      goToDefaultMode();
    } else if (modo === "guia") {
      setAppMode("guia");
      setIsFollowingUser(true);
      isFollowingUserRef.current = true;
      if (userLocation) {
        goToGuideMode(userLocation);
      }

      // Permitir libre exploración después de 5 segundos
      setTimeout(() => {
        setIsFollowingUser(false);
        isFollowingUserRef.current = false;
      }, 5000);
    }
  };

  const handleStartRoute = () => {
    setIsRouteSelectionVisible(true);
  };

  const handleRouteConfirm = async (
    start: [number, number],
    end: [number, number],
    startName: string,
    endName: string,
  ) => {
    // Para demo: colocar al usuario en el inicio de la ruta y mostrar avatar inmediatamente
    setUserLocation(start);
    setShowAvatar(true);

    await calculateRoute(start, end, startName, endName);
    handleModeToggle("guia");
  };

  const handleStopRoute = () => {
    clearRoute();
    clearRouteStore();
    handleModeToggle("ninguno");
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
    async () => {
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
    };
  }, []);

  useEffect(() => {
    let locSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;
    let simInterval: NodeJS.Timeout | null = null;

    if (appMode === "guia") {
      // DEMO: Simular el recorrido de la ruta en lugar de usar GPS real
      if (isRouteActive && activeRoute.length > 0) {
        setIsWalking(true);
        let currentIndex = 0;
        simInterval = setInterval(() => {
          if (currentIndex < activeRoute.length) {
            const point = activeRoute[currentIndex];
            const coords: [number, number] = [point.longitude, point.latitude];
            setUserLocation(coords);
            if (isFollowingUserRef.current) {
              moveToPoint(coords);
            }
            currentIndex++;
          } else {
            setIsWalking(false);
            if (simInterval) clearInterval(simInterval);
          }
        }, 1500); // Mueve el avatar a lo largo de la ruta cada 1.5s
      }

      /* Código original de GPS comentado para la demo:
      (async () => {
        // Suscribirse a la ubicación
        locSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 1,
          },
          (loc) => {
            const coords: [number, number] = [
              loc.coords.longitude,
              loc.coords.latitude,
            ];
            setUserLocation(coords);
            if (isFollowingUserRef.current) {
              moveToPoint(coords);
            }
            if (appMode === "guia") {
              const speed = loc.coords.speed || 0;
              setIsWalking(speed > 0.5);
            }
          },
        );

        // Suscribirse a la brújula
        headSub = await Location.watchHeadingAsync((head) => {
          setHeading(head.magHeading);
        });
      })();
      */
    } else if (appMode === "ninguno" || appMode === "libre") {
      // Limpiar suscripciones si se sale del modo guía
      if (locSub) locSub.remove();
      if (headSub) headSub.remove();
      if (simInterval) clearInterval(simInterval);
    }

    return () => {
      if (locSub) locSub.remove();
      if (headSub) headSub.remove();
      if (simInterval) clearInterval(simInterval);
    };
  }, [appMode, isRouteActive, activeRoute]);

  useEffect(() => {
    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    };
  }, []);

  // @ts-ignore
  const pointsFeatures = UNMSM_POIS.features.filter(
    (f) => f.geometry.type === "Point",
  );

  const filteredPoints = {
    type: "FeatureCollection",
    // @ts-ignore
    features: activeCategory
      ? pointsFeatures.filter((f) => f.properties?.categoria === activeCategory)
      : [],
  };

  const routeData =
    isRouteActive && activeRoute.length > 0
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: activeRoute.map((c) => [c.longitude, c.latitude]),
              },
            },
          ],
        }
      : { type: "FeatureCollection", features: [] };

  const destinationCoord =
    isRouteActive && activeRoute.length > 0
      ? [
          activeRoute[activeRoute.length - 1].longitude,
          activeRoute[activeRoute.length - 1].latitude,
        ]
      : null;

  const startCoord =
    isRouteActive && activeRoute.length > 0
      ? [activeRoute[0].longitude, activeRoute[0].latitude]
      : null;

  const shouldShowAvatar =
    showAvatar &&
    userLocation !== null &&
    (appMode === "libre" || appMode === "guia");

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
          {/* Capa exterior gruesa (brillo/sombra) */}
          <MapboxGL.LineLayer
            id="route-glow"
            style={{
              lineColor: primaryColor,
              lineWidth: 10,
              lineOpacity: 0.3,
              lineJoin: "round",
              lineCap: "round",
            }}
          />
          {/* Capa central brillante */}
          <MapboxGL.LineLayer
            id="route-line"
            style={{
              lineColor: primaryColor,
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
            {appMode === "guia" ? (
              <Image
                source={avatarSource}
                style={{ width: 80, height: 80 }}
                contentFit="contain"
              />
            ) : (
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
            )}
          </MapboxGL.PointAnnotation>
        )}

        {startCoord && (
          <MapboxGL.PointAnnotation
            id="start-pin"
            key={`start-pin-${primaryColor}`}
            coordinate={startCoord as [number, number]}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "white",
                borderWidth: 6,
                borderColor: primaryColor,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            />
          </MapboxGL.PointAnnotation>
        )}

        {destinationCoord && (
          <MapboxGL.PointAnnotation
            id="destination-pin"
            key={`destination-pin-${primaryColor}`}
            coordinate={destinationCoord as [number, number]}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: primaryColor,
                  padding: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <MapPin size={16} color="white" />
              </View>
              {/* Punta del pin */}
              <View
                style={{
                  width: 0,
                  height: 0,
                  backgroundColor: "transparent",
                  borderStyle: "solid",
                  borderTopWidth: 8,
                  borderRightWidth: 6,
                  borderBottomWidth: 0,
                  borderLeftWidth: 6,
                  borderTopColor: primaryColor,
                  borderRightColor: "transparent",
                  borderBottomColor: "transparent",
                  borderLeftColor: "transparent",
                  marginTop: -2,
                }}
              />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* ── CAPA 2: AVATAR FLOTANTE ── */}
      {shouldShowAvatar && appMode === "libre" && (
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
      <MapLocationButton
        disabled={userLocation === null}
        onPress={() => {
          if (userLocation) {
            setIsFollowingUser(true);
            isFollowingUserRef.current = true;
            moveToPoint(userLocation);
          }
        }}
      />
      <MapActionButtons
        onModeSelect={handleModeToggle}
        onStartRoute={handleStartRoute}
        onStopRoute={handleStopRoute}
        isRouteActive={isRouteActive}
      />

      <MapSpawnModal
        visible={isSpawnModalVisible}
        onClose={() => setIsSpawnModalVisible(false)}
        onSelectPoint={handleSpawnSelection}
      />

      <MapRouteSelectionModal
        visible={isRouteSelectionVisible}
        onClose={() => setIsRouteSelectionVisible(false)}
        onRouteConfirm={handleRouteConfirm}
        userLocation={userLocation}
      />

      <MapRouteInfoCard />
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
