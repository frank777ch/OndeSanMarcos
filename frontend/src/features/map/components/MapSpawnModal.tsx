import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightColors } from "@/theme/light";

// Las opciones de lugares donde el usuario puede aparecer
const SPAWN_POINTS = [
  {
    id: "p2",
    nombre: "Puerta 2 (Av. Universitaria)",
    coords: [-77.07936395135454, -12.059496369475596] as [number, number],
  },
  {
    id: "p3",
    nombre: "Puerta 3 (Fac. de Ciencias Contables)",
    coords: [-77.08001732406147, -12.057136012331654] as [number, number],
  },
  {
    id: "p7",
    nombre: "Puerta 7 (Fac. de Ing. de Sistemas)",
    coords: [-77.08454506116111, -12.053801766665373] as [number, number],
  },
  {
    id: "p8",
    nombre: "Puerta 8 (Fac. de Ing. de Minas)",
    coords: [-77.08761951511643, -12.051880164062666] as [number, number],
  },
];

interface MapSpawnModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPoint: (coords: [number, number]) => void;
}

export function MapSpawnModal({
  visible,
  onClose,
  onSelectPoint,
}: MapSpawnModalProps) {
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
      />

      {/* Panel blanco inferior */}
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Dónde quieres empezar?</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={28} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Elige un punto para explorar el campus en Modo Libre.
        </Text>

        <View style={styles.optionsContainer}>
          {SPAWN_POINTS.map((point) => (
            <TouchableOpacity
              key={point.id}
              style={styles.optionButton}
              activeOpacity={0.7}
              onPress={() => onSelectPoint(point.coords)}
            >
              <Ionicons
                name="location"
                size={20}
                color={lightColors.bgPrimaryBtn}
              />
              <Text style={styles.optionText}>{point.nombre}</Text>
            </TouchableOpacity>
          ))}
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
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
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
