import React, { useState, useEffect, useRef } from "react";
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
import { CampusPlace, ALL_SEARCHABLE_PLACES } from "../constants/unmsm";
import { useThemeStore } from "@/core/store/useThemeStore";

interface MapRouteSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onRouteConfirm: (start: [number, number], end: [number, number], startName: string, endName: string, startIsCurrentLocation: boolean) => void;
  userLocation: [number, number] | null;
}

export function MapRouteSelectionModal({
  visible,
  onClose,
  onRouteConfirm,
  userLocation,
}: MapRouteSelectionModalProps) {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const [startPlace, setStartPlace] = useState<CampusPlace | "current" | null>(null);
  const [endPlace, setEndPlace] = useState<CampusPlace | null>(null);

  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [activeField, setActiveField] = useState<"start" | "end">("start");

  const startInputRef = useRef<TextInput>(null);
  const endInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      if (userLocation) {
        setStartPlace("current");
        setStartQuery("Ubicación actual");
        setActiveField("end");
      } else {
        setStartPlace(null);
        setStartQuery("");
        setActiveField("start");
      }
      setEndPlace(null);
      setEndQuery("");
    }
  }, [visible]);

  const handleSelectPlace = (place: CampusPlace) => {
    if (activeField === "start") {
      setStartPlace(place);
      setStartQuery(place.name);
      setActiveField("end"); // Auto-enfocar destino
      setTimeout(() => endInputRef.current?.focus(), 100);
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
      setTimeout(() => endInputRef.current?.focus(), 100);
    }
  };

  const handleStartQueryChange = (text: string) => {
    setStartQuery(text);
    if (startPlace === "current") {
      if (text !== "Ubicación actual") setStartPlace(null);
    } else if (startPlace) {
      if (text !== startPlace.name) setStartPlace(null);
    }
  };

  const handleEndQueryChange = (text: string) => {
    setEndQuery(text);
    if (endPlace && text !== endPlace.name) {
      setEndPlace(null);
    }
  };

  const handleConfirm = () => {
    if (!startPlace || !endPlace) return;

    let startCoord: [number, number];
    if (startPlace === "current") {
      if (!userLocation) return;
      startCoord = userLocation;
    } else {
      startCoord = [
        startPlace.entranceCoordinate?.longitude ?? startPlace.coordinate.longitude,
        startPlace.entranceCoordinate?.latitude ?? startPlace.coordinate.latitude,
      ];
    }

    const endCoord: [number, number] = [
      endPlace.entranceCoordinate?.longitude ?? endPlace.coordinate.longitude,
      endPlace.entranceCoordinate?.latitude ?? endPlace.coordinate.latitude,
    ];

    onRouteConfirm(startCoord, endCoord, startQuery, endQuery, startPlace === "current");
    onClose();
  };

  const isReady = startPlace !== null && endPlace !== null;

  const currentQuery = activeField === "start" ? startQuery : endQuery;
  let filteredPlaces = ALL_SEARCHABLE_PLACES.filter((place) => {
    if (!currentQuery || (activeField === "start" && startPlace === "current"))
      return true;
    if (activeField === "end" && endPlace !== null) return true; // Ya seleccionado

    const lowerQuery = currentQuery.toLowerCase();
    return (
      place.name.toLowerCase().includes(lowerQuery) ||
      place.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  });

  if (!currentQuery || (activeField === "start" && startPlace === "current") || (activeField === "end" && endPlace !== null)) {
    filteredPlaces = filteredPlaces.slice(0, 8);
  }

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
              activeField === "start" && [
                styles.inputBoxActive,
                { borderColor: primaryColor },
              ],
            ]}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={activeField === "start" ? primaryColor : "#777"}
            />
            <TextInput
              ref={startInputRef}
              style={styles.textInput}
              placeholder="Elegir punto de partida..."
              placeholderTextColor="#999"
              value={startQuery}
              onChangeText={handleStartQueryChange}
              onFocus={() => setActiveField("start")}
            />
            {startQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleStartQueryChange("")}>
                <Ionicons name="close-circle" size={20} color="#C4C4C4" />
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.inputBox,
              activeField === "end" && [
                styles.inputBoxActive,
                { borderColor: primaryColor },
              ],
            ]}
          >
            <Ionicons
              name="flag-outline"
              size={20}
              color={activeField === "end" ? primaryColor : "#777"}
            />
            <TextInput
              ref={endInputRef}
              style={styles.textInput}
              placeholder="Elegir destino..."
              placeholderTextColor="#999"
              value={endQuery}
              onChangeText={handleEndQueryChange}
              onFocus={() => setActiveField("end")}
            />
            {endQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleEndQueryChange("")}>
                <Ionicons name="close-circle" size={20} color="#C4C4C4" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.subtitle}>Sugerencias del campus</Text>

        <ScrollView 
          style={styles.optionsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {activeField === "start" &&
            userLocation &&
            startPlace !== "current" && (
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
              <Ionicons name="business" size={20} color={primaryColor} />
              <Text style={styles.optionText}>{place.name}</Text>
            </TouchableOpacity>
          ))}

          {filteredPlaces.length === 0 && (
            <Text style={styles.emptyText}>No se encontraron lugares.</Text>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: primaryColor },
            !isReady && { backgroundColor: `${primaryColor}1A` },
          ]}
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
    paddingTop: 60, // para no superponer con el status bar en dispositivos con notch
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "absolute",
    top: 0,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
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
  confirmButtonText: {
    color: "white",
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
  },
});
