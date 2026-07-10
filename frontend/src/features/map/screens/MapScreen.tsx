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
import { MapPlaceInfoCard } from "../components/MapPlaceInfoCard";
import { useMapStore } from "../../../core/store/useMapStore";
import { useRouting } from "../../routing/hooks/useRouting";
import { haversineDistance } from "../../routing/utils/pathfinder";
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

// Distancia (m) que le falta al usuario para llegar al destino siguiendo la
// polilínea de la ruta: tramo hasta el vértice más cercano + resto de la ruta.
function remainingRouteDistance(
  user: [number, number],
  route: { latitude: number; longitude: number }[],
): number {
  if (route.length === 0) return 0;
  let nearest = 0;
  let best = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = haversineDistance(user, [route[i].longitude, route[i].latitude]);
    if (d < best) {
      best = d;
      nearest = i;
    }
  }
  let total = best;
  for (let i = nearest; i < route.length - 1; i++) {
    total += haversineDistance(
      [route[i].longitude, route[i].latitude],
      [route[i + 1].longitude, route[i + 1].latitude],
    );
  }
  return Math.round(total);
}

export function MapScreen() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [showAvatar, setShowAvatar] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [exploreLocation, setExploreLocation] = useState<
    [number, number] | null
  >(null);

  // "guia" se controla por separado en el store (guideActive) para que la ruta
  // y la UI de navegación puedan activarlo/detenerlo.
  const [appMode, setAppMode] = useState<"ninguno" | "libre">("ninguno");
  const [isSpawnModalVisible, setIsSpawnModalVisible] = useState(false);
  const [isRouteSelectionVisible, setIsRouteSelectionVisible] = useState(false);
  const {
    cameraRef,
    cameraConfig,
    goToDefaultMode,
    goToFreeMode,
    goToRoutePreview,
    goToGuideMode,
    moveToPoint,
    setHeading,
  } = useMapCamera();

  const activeRoute = useMapStore((state) => state.activeRoute);
  const isRouteActive = useMapStore((state) => state.isRouteActive);
  const clearRouteStore = useMapStore((state) => state.clearRoute);
  const guideActive = useMapStore((state) => state.guideActive);
  const startGuide = useMapStore((state) => state.startGuide);
  const stopGuide = useMapStore((state) => state.stopGuide);
  const setRemainingDistance = useMapStore(
    (state) => state.setRemainingDistance,
  );
  const { calculateRoute, clearRoute, isCalculating } = useRouting();

  const primaryColor = useThemeStore((s) => s.primaryColor);
  const routeMetadata = useMapStore((s) => s.routeMetadata);

  // Destino solicitado desde fuera del mapa (chat o botón "Abrir"): HU-2.3.
  const focusTarget = useMapStore((s) => s.focusTarget);
  const clearFocusTarget = useMapStore((s) => s.clearFocusTarget);
  const focusedPlace = useMapStore((s) => s.focusedPlace);

  // Timer para detectar cuándo el usuario dejó de arrastrar el mapa
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const isFollowingUserRef = useRef(true);

  // Se llama en cada frame mientras la cámara se mueve (usuario arrastrando)
  const handleCameraChanged = (e: any) => {
    if (e.properties && e.properties.isUserInteraction) {
      if (guideActive) {
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
      stopGuide();
      setIsSpawnModalVisible(true);
    } else if (modo === "ninguno") {
      setIsWalking(false);
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      stopGuide();
      setAppMode("ninguno");
      goToDefaultMode();
    } else if (modo === "guia") {
      setAppMode("ninguno");
      startGuide();
      // El seguimiento se mantiene activo hasta que el usuario arrastra el mapa;
      // entonces puede reactivarlo con el botón de ubicación.
      setIsFollowingUser(true);
      isFollowingUserRef.current = true;
      if (userLocation) {
        goToGuideMode(userLocation);
      }
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
    startIsCurrentLocation: boolean,
  ) => {
    // Trazamos la ruta
    const coords = await calculateRoute(start, end, startName, endName);

    setAppMode("ninguno");
    setIsWalking(false);

    // Si parte de la ubicación actual y la ruta existe, arrancamos el modo guía
    // (seguimiento en tiempo real). Si no, mostramos una vista previa de la ruta.
    if (startIsCurrentLocation && coords && coords.length > 0) {
      startGuide();
      setIsFollowingUser(true);
      isFollowingUserRef.current = true;
      goToGuideMode(start);
    } else {
      setIsFollowingUser(false);
      isFollowingUserRef.current = false;
      goToRoutePreview(start);
    }
  };

  const handleStopRoute = () => {
    clearRoute();
    clearRouteStore();
    handleModeToggle("ninguno");
  };

  const handleSpawnSelection = (
    coords: [number, number],
    isCurrentLocation?: boolean,
  ) => {
    setIsSpawnModalVisible(false);
    setAppMode("libre");
    if (!isCurrentLocation) {
      setExploreLocation(coords);
    } else {
      setExploreLocation(null);
    }
    goToFreeMode(coords);
  };

  // Reacciona a un destino escrito en useMapStore.focusTarget (HU-2.3).
  // - drawRoute=true (intención de navegación desde el chat): traza la ruta
  //   desde la ubicación del usuario hasta el destino. Sin GPS, solo centra.
  // - Si no, solo centra el mapa (p. ej. buscar un lugar).
  // moveToPoint/calculateRoute no están memoizados; los omitimos de las deps a
  // propósito para evitar disparos en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!focusTarget) return;
    const dest: [number, number] = [
      focusTarget.entranceCoordinate?.longitude ?? focusTarget.longitude,
      focusTarget.entranceCoordinate?.latitude ?? focusTarget.latitude,
    ];

    if (focusTarget.drawRoute && userLocation) {
      calculateRoute(
        userLocation,
        dest,
        "Mi ubicación",
        focusTarget.name ?? "Destino",
      );
      setIsFollowingUser(false);
      isFollowingUserRef.current = false;
      goToRoutePreview(userLocation);
    } else {
      moveToPoint(dest);
    }
    clearFocusTarget();
  }, [focusTarget, clearFocusTarget]);

  useEffect(() => {
    const checkGps = async () => {
      try {
        const { locationServicesEnabled } =
          await Location.getProviderStatusAsync();
        setIsGpsEnabled(locationServicesEnabled);
      } catch (e) {
        setIsGpsEnabled(false);
      }
    };
    checkGps();
    const interval = setInterval(checkGps, 3000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    let locSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;
    let simInterval: NodeJS.Timeout | null = null;

    if (guideActive) {
      (async () => {
        // Suscribirse a la ubicación real
        try {
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
              const speed = loc.coords.speed || 0;
              setIsWalking(speed > 0.5);

              // Progreso de navegación: distancia restante hasta el destino.
              const route = useMapStore.getState().activeRoute;
              if (route.length > 0) {
                setRemainingDistance(remainingRouteDistance(coords, route));
              }
            },
          );

          // Suscribirse a la brújula
          headSub = await Location.watchHeadingAsync((head) => {
            setHeading(head.magHeading);
          });
        } catch (error) {
          console.error(
            "Error activando seguimiento GPS en tiempo real",
            error,
          );
        }
      })();
    }
    // Al desactivar la guía, el cleanup de abajo libera las suscripciones.

    return () => {
      if (locSub) locSub.remove();
      if (headSub) headSub.remove();
      if (simInterval) clearInterval(simInterval);
    };
  }, [guideActive]);

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

  const routeFeatures: any[] = [];

  if (isRouteActive && activeRoute.length > 0) {
    const coords = activeRoute.map((c) => [c.longitude, c.latitude]);
    const { startDashed, endDashed } = routeMetadata || {};

    let mainStartIndex = 0;
    let mainEndIndex = coords.length - 1;

    if (startDashed && coords.length > 1) {
      routeFeatures.push({
        type: "Feature",
        properties: { isDashed: true },
        geometry: {
          type: "LineString",
          coordinates: [coords[0], coords[1]],
        },
      });
      mainStartIndex = 1;
    }

    if (endDashed && coords.length > 1) {
      routeFeatures.push({
        type: "Feature",
        properties: { isDashed: true },
        geometry: {
          type: "LineString",
          coordinates: [coords[coords.length - 2], coords[coords.length - 1]],
        },
      });
      mainEndIndex = coords.length - 2;
    }

    if (mainStartIndex <= mainEndIndex) {
      routeFeatures.push({
        type: "Feature",
        properties: { isDashed: false },
        geometry: {
          type: "LineString",
          coordinates: coords.slice(mainStartIndex, mainEndIndex + 1),
        },
      });
    }
  }

  const routeData = {
    type: "FeatureCollection",
    features: routeFeatures,
  };

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
    showAvatar && userLocation !== null && (appMode === "libre" || guideActive);

  const avatarSource = isWalking
    ? require("../../../../assets/avatar/david_walk.webp")
    : require("../../../../assets/avatar/david_idle.webp");

  return (
    <View style={styles.container}>
      {/* ── CAPA 1: MAPA ── */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/standard"
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

        {/*
        Ya no compilamos la capa de edificios 3D. El standard style de Mapbox ya incluye edificios 3D, y la capa personalizada generaba problemas de rendimiento y compatibilidad con el estilo actual.
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
        </MapboxGL.VectorSource>*/}

        <MapboxGL.ShapeSource id="route-source" shape={routeData as any}>
          {/* Capa exterior gruesa (brillo/sombra) para la ruta sólida */}
          <MapboxGL.LineLayer
            id="route-glow"
            filter={["==", "isDashed", false]}
            style={{
              lineColor: primaryColor,
              lineWidth: 10,
              lineOpacity: 0.3,
              lineJoin: "round",
              lineCap: "round",
            }}
          />
          {/* Capa central brillante para la ruta sólida */}
          <MapboxGL.LineLayer
            id="route-line"
            filter={["==", "isDashed", false]}
            style={{
              lineColor: primaryColor,
              lineWidth: 5,
              lineJoin: "round",
              lineCap: "round",
            }}
          />
          {/* Capa para los tramos punteados */}
          <MapboxGL.LineLayer
            id="route-line-dashed"
            filter={["==", "isDashed", true]}
            style={{
              lineColor: primaryColor,
              lineWidth: 4,
              lineOpacity: 0.7,
              lineDasharray: [2, 2],
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

        {isGpsEnabled && userLocation && (
          <MapboxGL.MarkerView
            id="user-location"
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {isInsideCampus(userLocation[1], userLocation[0]) &&
            (appMode !== "ninguno" || guideActive) ? (
              <Image
                source={avatarSource}
                style={{ width: 80, height: 80 }}
                contentFit="contain"
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: primaryColor,
                    opacity: 0.3,
                  }}
                />
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: primaryColor,
                    borderWidth: 2.5,
                    borderColor: "white",
                  }}
                />
              </View>
            )}
          </MapboxGL.MarkerView>
        )}

        {appMode === "libre" && exploreLocation && (
          <MapboxGL.MarkerView
            id="explore-location"
            coordinate={exploreLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "rgba(66, 133, 244, 0.3)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#4285F4",
                  borderWidth: 2,
                  borderColor: "white",
                }}
              />
            </View>
          </MapboxGL.MarkerView>
        )}

        {focusedPlace && (
          <MapboxGL.MarkerView
            id="focused-place-pin"
            coordinate={[focusedPlace.longitude, focusedPlace.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 50,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  backgroundColor: primaryColor,
                  borderRadius: 20,
                  padding: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 6,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={22} color="white" />
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 5,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderTopWidth: 10,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: primaryColor,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 1,
                  width: 8,
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.3)",
                }}
              />
            </View>
          </MapboxGL.MarkerView>
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
          <MapboxGL.MarkerView
            id="destination-pin"
            key={`destination-pin-${primaryColor}`}
            coordinate={destinationCoord as [number, number]}
            anchor={{ x: 0.5, y: 0.5 }}
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
                <MapPin size={16} color={primaryColor} />
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
          </MapboxGL.MarkerView>
        )}
      </MapboxGL.MapView>

      {/* ── CAPA 3: UI ── */}
      <MapSearchBar />
      <MapFilterChips
        activeFilter={activeCategory}
        onFilterChange={(categoria) =>
          setActiveCategory((prev) => (prev === categoria ? null : categoria))
        }
      />
      <MapLocationButton
        disabled={!isGpsEnabled}
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
        isGpsEnabled={isGpsEnabled}
      />

      <MapSpawnModal
        visible={isSpawnModalVisible}
        onClose={() => setIsSpawnModalVisible(false)}
        onSelectPoint={handleSpawnSelection}
        isGpsEnabled={isGpsEnabled}
        userLocation={userLocation}
      />

      <MapRouteSelectionModal
        visible={isRouteSelectionVisible}
        onClose={() => setIsRouteSelectionVisible(false)}
        onRouteConfirm={handleRouteConfirm}
        userLocation={userLocation}
      />

      <MapPlaceInfoCard />
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
