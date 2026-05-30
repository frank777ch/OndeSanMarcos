import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMapStore } from '@/core/store/useMapStore';
import { lightColors } from '@/theme/light';
import { useThemeStore } from '@/core/store/useThemeStore';

export function MapRouteInfoCard() {
  const isRouteActive = useMapStore((s) => s.isRouteActive);
  const routeMetadata = useMapStore((s) => s.routeMetadata);
  const clearRoute = useMapStore((s) => s.clearRoute);
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const setMapMode = useMapStore((s) => s.setMapMode);

  if (!isRouteActive || !routeMetadata) return null;

  // Formato de tiempo estimado (aprox. 1.4 m/s caminando)
  const timeMinutes = Math.max(1, Math.round(routeMetadata.distance / 84));

  const handleStop = () => {
    clearRoute();
    setMapMode("free"); // Vuelve a modo libre al terminar
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <View style={styles.points}>
          <Text style={styles.fromText} numberOfLines={1}>De: {routeMetadata.startName}</Text>
          <Text style={styles.toText} numberOfLines={1}>{routeMetadata.endName}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={[styles.distanceText, { color: primaryColor }]}>{routeMetadata.distance}m</Text>
          <Text style={styles.timeText}>{timeMinutes} min</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.stopButton, { backgroundColor: primaryColor }]} 
        activeOpacity={0.8}
        onPress={handleStop}
      >
        <Ionicons name="close-circle-outline" size={20} color="white" />
        <Text style={styles.stopButtonText}>Terminar Ruta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  points: {
    flex: 1,
    paddingRight: 12,
  },
  fromText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  toText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: lightColors.textH1,
  },
  distanceBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  distanceText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
  },
  timeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  stopButtonText: {
    fontFamily: 'DMSans_700Bold',
    color: 'white',
    fontSize: 16,
  },
});
