import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";
import { UNMSM_POIS, CAMPUS_PLACES } from "../constants/unmsm";

// Construir la lista dinámicamente con puertas, comedor, rectorado y gimnasio
const doors = UNMSM_POIS.features
  .filter((f) => f.properties?.categoria === "Puertas")
  .map((f) => ({
    id: f.properties.id,
    nombre: f.properties.nombre,
    coords: f.geometry.coordinates as [number, number],
  }));

const otherIds = ["comedor-universitario", "rectorado", "museo-historia-natural"];
const others = CAMPUS_PLACES.filter((p) => otherIds.includes(p.id)).map((p) => ({
  id: p.id,
  nombre: p.name,
  coords: [p.coordinate.longitude, p.coordinate.latitude] as [number, number],
}));

const SPAWN_POINTS = [...doors, ...others];

interface MapSpawnModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPoint: (coords: [number, number], isCurrentLocation?: boolean) => void;
  isGpsEnabled?: boolean;
  userLocation?: [number, number] | null;
}

export function MapSpawnModal({
  visible,
  onClose,
  onSelectPoint,
  isGpsEnabled,
  userLocation,
}: MapSpawnModalProps) {
  const primaryColor = useThemeStore((s) => s.primaryColor);

  const displayPoints = isGpsEnabled && userLocation
    ? [{ id: "current-location", nombre: "Mi Ubicación", coords: userLocation }, ...SPAWN_POINTS]
    : SPAWN_POINTS;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Fondo oscuro semi-transparente */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
      />

      {/* Panel blanco inferior */}
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Dónde quieres empezar?</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Ionicons name="close-circle" size={28} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Elige un punto para explorar el campus en Modo Libre.
        </Text>

        <View style={styles.listContainer}>
          <FlatList
            data={displayPoints}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.optionButton}
                activeOpacity={0.7}
                onPress={() => onSelectPoint(item.coords, item.id === "current-location")}
                accessibilityRole="button"
                accessibilityLabel={`Empezar en ${item.nombre}`}
              >
                <Ionicons name="location" size={20} color={primaryColor} />
                <Text style={styles.optionText}>{item.nombre}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.flatListContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: "absolute",
    bottom: 0,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: lightColors.textH1,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: lightColors.textInfoP,
    marginBottom: 20,
  },
  listContainer: {
    maxHeight: 300, // altura máxima para hacer scroll
    marginBottom: 20,
  },
  flatListContent: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 16,
  },
  optionText: {
    marginLeft: 12,
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textH1,
  },
});
