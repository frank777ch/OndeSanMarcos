import { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import Constants from "expo-constants";

import { MapSearchBar } from '../components/MapSearchBar';
import { MapFilterChips } from '../components/MapFilterChips';
import { UNMSM, UNMSM_POIS } from '../constants/unmsm';
import { MapLocationButton } from '../components/MapLocationButton';
import { MapActionButtons } from '../components/MapActionButtons';

MapboxGL.setAccessToken(Constants.expoConfig?.extra?.mapboxPublicToken);

export function MapScreen() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setShowAvatar(false);
        return;
      }
      // Centramos el avatar temporalmente en el centro del campus
      setUserLocation([UNMSM.center.longitude, UNMSM.center.latitude]); 
      setShowAvatar(true);
    })();
  }, []);

  // Filtramos el GeoJSON según la categoría seleccionada en los Chips
  const filteredPOIs = {
    ...UNMSM_POIS,
    features: activeCategory 
      ? UNMSM_POIS.features.filter(f => f.properties.categoria === activeCategory)
      : [] 
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} styleURL="mapbox://styles/mapbox/streets-v12">
        <MapboxGL.Camera
          zoomLevel={UNMSM.camera.zoomLevel}
          centerCoordinate={[UNMSM.center.longitude, UNMSM.center.latitude]}
          pitch={UNMSM.camera.pitch}
          animationMode="flyTo"
          animationDuration={1500}
        />

        {/* --- MAGIA 3D --- */}
        <MapboxGL.VectorSource id="composite" url="mapbox://mapbox.mapbox-streets-v8">
          <MapboxGL.FillExtrusionLayer
            id="3d-buildings"
            sourceLayerID="building"
            filter={['==', 'extrude', 'true']}
            style={{
              fillExtrusionColor: '#e0e0e0', 
              fillExtrusionHeight: ['get', 'height'], 
              fillExtrusionBase: ['get', 'min_height'],
              fillExtrusionOpacity: 0.9,
            }}
          />
        </MapboxGL.VectorSource>

        {/* --- CAPA DE PUNTOS DE INTERÉS (FILTROS) --- */}
        <MapboxGL.ShapeSource id="poi-source" shape={filteredPOIs as any}>
          <MapboxGL.CircleLayer
            id="poi-circles"
            style={{
              circleRadius: 8,
              circleColor: '#E74C3C', 
              circleStrokeWidth: 2,
              circleStrokeColor: '#FFFFFF',
            }}
          />
          <MapboxGL.SymbolLayer
            id="poi-text"
            style={{
              textField: ['get', 'nombre'],
              textSize: 12,
              textOffset: [0, 1.2], 
              textAnchor: 'top',
              textColor: '#000000',
              textHaloColor: '#FFFFFF',
              textHaloWidth: 1,
            }}
          />
        </MapboxGL.ShapeSource>

        {/* --- AVATAR --- */}
        {showAvatar && userLocation && (
          <MapboxGL.PointAnnotation id="avatar" coordinate={userLocation}>
            <View style={styles.avatarContainer}>
              <Text style={{ fontSize: 34 }}>👨‍🏫</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* --- UI FLOTANTE --- */}
      <MapSearchBar />
      
      <MapFilterChips 
        activeFilter={activeCategory} 
        onFilterChange={(categoria) => {
          setActiveCategory(prev => prev === categoria ? null : categoria);
        }} 
      />

      {/* NUEVOS COMPONENTES AQUÍ */}
      <MapLocationButton />
      <MapActionButtons />

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
    backgroundColor: "rgba(255, 255, 255, 0.8)"
  }
});