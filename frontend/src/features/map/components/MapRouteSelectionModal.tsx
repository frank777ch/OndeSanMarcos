import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightColors } from "@/theme/light";
import { CAMPUS_PLACES, CampusPlace } from "../constants/unmsm";
import { useThemeStore } from "@/core/store/useThemeStore";

interface MapRouteSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onRouteConfirm: (start: [number, number], end: [number, number]) => void;
  userLocation: [number, number] | null;
}

export function MapRouteSelectionModal({
  visible,
  onClose,
  onRouteConfirm,
  userLocation,
}: MapRouteSelectionModalProps) {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const [startPlace, setStartPlace] = useState<CampusPlace | "current" | null>(
    userLocation ? "current" : null
  );
  const [endPlace, setEndPlace] = useState<CampusPlace | null>(null);
  
  const [startQuery, setStartQuery] = useState(userLocation ? "Ubicación actual" : "");
  const [endQuery, setEndQuery] = useState("");
  const [activeField, setActiveField] = useState<"start" | "end">("end");

  const handleSelectPlace = (place: CampusPlace) => {
    if (activeField === "start") {
      setStartPlace(place);
      setStartQuery(place.name);
      setActiveField("end"); // Auto-enfocar destino
    } else {
      setEndPlace(place);
      setEndQuery(place.name);
    }
  };

  const handleSelectCurrentLocation = () => {
    if (userLocation) {
      setStartPlace("current");
      setStartQuery("Ubicación actual");
      setActiveField("end");
    }
  };

  const handleStartQueryChange = (text: string) => {
    setStartQuery(text);
    if (startPlace) setStartPlace(null);
  };

  const handleEndQueryChange = (text: string) => {
    setEndQuery(text);
    if (endPlace) setEndPlace(null);
  };

  const handleConfirm = () => {
    if (!startPlace || !endPlace) return;

    let startCoord: [number, number];
    if (startPlace === "current") {
      if (!userLocation) return;
      startCoord = userLocation;
    } else {
      startCoord = [startPlace.coordinate.longitude, startPlace.coordinate.latitude];
    }

    const endCoord: [number, number] = [
      endPlace.coordinate.longitude,
      endPlace.coordinate.latitude,
    ];

    onRouteConfirm(startCoord, endCoord);
    onClose();
  };

  const isReady = startPlace !== null && endPlace !== null;

  const currentQuery = activeField === "start" ? startQuery : endQuery;
  const filteredPlaces = CAMPUS_PLACES.filter((place) => {
    if (!currentQuery || (activeField === "start" && startPlace === "current")) return true;
    if (activeField === "end" && endPlace !== null) return true; // Ya seleccionado
    
    const lowerQuery = currentQuery.toLowerCase();
    return (
      place.name.toLowerCase().includes(lowerQuery) ||
      place.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Planificar ruta</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={28} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputsContainer}>
          <View
            style={[
              styles.inputBox,
              activeField === "start" && [styles.inputBoxActive, { borderColor: primaryColor }],
            ]}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={activeField === "start" ? primaryColor : "#777"}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Elegir punto de partida..."
              placeholderTextColor="#999"
              value={startQuery}
              onChangeText={handleStartQueryChange}
              onFocus={() => setActiveField("start")}
            />
          </View>

          <View
            style={[
              styles.inputBox,
              activeField === "end" && [styles.inputBoxActive, { borderColor: primaryColor }],
            ]}
          >
            <Ionicons
              name="flag-outline"
              size={20}
              color={activeField === "end" ? primaryColor : "#777"}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Elegir destino..."
              placeholderTextColor="#999"
              value={endQuery}
              onChangeText={handleEndQueryChange}
              onFocus={() => setActiveField("end")}
            />
          </View>
        </View>

        <Text style={styles.subtitle}>Sugerencias del campus</Text>

        <ScrollView style={styles.optionsContainer}>
          {activeField === "start" && userLocation && startPlace !== "current" && (
            <TouchableOpacity
              style={styles.optionButton}
              activeOpacity={0.7}
              onPress={handleSelectCurrentLocation}
            >
              <Ionicons name="navigate" size={20} color={primaryColor} />
              <Text style={styles.optionText}>Ubicación actual</Text>
            </TouchableOpacity>
          )}

          {filteredPlaces.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.optionButton}
              activeOpacity={0.7}
              onPress={() => handleSelectPlace(place)}
              >
              <Ionicons
                name="business"
                size={20}
                color={primaryColor}
              />
              <Text style={styles.optionText}>{place.name}</Text>
            </TouchableOpacity>
          ))}
          
          {filteredPlaces.length === 0 && (
            <Text style={styles.emptyText}>No se encontraron lugares.</Text>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: primaryColor }, !isReady && styles.confirmButtonDisabled]}
          disabled={!isReady}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Iniciar Ruta</Text>
        </TouchableOpacity>
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
    maxHeight: "80%",
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
    marginBottom: 16,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: lightColors.textH1,
  },
  inputsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    padding: 10,
  },
  inputBoxActive: {
    // borderColor: lightColors.bgPrimaryBtn, // Dynamic
    backgroundColor: "#F0F8FF",
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: lightColors.textH1,
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: lightColors.textH1,
    marginBottom: 12,
  },
  optionsContainer: {
    maxHeight: 250,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    marginLeft: 12,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: lightColors.textH1,
  },
  emptyText: {
    fontFamily: "DMSans_400Regular",
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  confirmButton: {
    // backgroundColor: lightColors.bgPrimaryBtn, // Dynamic
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#A0C4FF",
  },
  confirmButtonText: {
    color: "white",
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
  },
});
