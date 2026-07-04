import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
  BackHandler,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";
import { ALL_SEARCHABLE_PLACES, CampusPlace } from "../constants/unmsm";
import { useMapStore } from "@/core/store/useMapStore";
import { X } from "lucide-react-native";

export function MapSearchBar() {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const setFocusTarget = useMapStore((s) => s.setFocusTarget);
  const focusedPlace = useMapStore((s) => s.focusedPlace);
  const setFocusedPlace = useMapStore((s) => s.setFocusedPlace);

  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!focusedPlace) {
      setQuery("");
    }
  }, [focusedPlace]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isExpanded) {
          handleClose();
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [isExpanded]);

  const handleOpen = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setIsExpanded(false);
    Keyboard.dismiss();
  };

  const handleSelectPlace = (place: CampusPlace) => {
    setQuery(place.name);
    handleClose();
    setFocusTarget({
      latitude: place.coordinate.latitude,
      longitude: place.coordinate.longitude,
    });
    setFocusedPlace({
      id: place.id,
      name: place.name,
      schedule: place.schedule,
      latitude: place.coordinate.latitude,
      longitude: place.coordinate.longitude,
      description: place.description,
      phone: place.phone,
      careers: place.careers,
      usage: place.usage,
      services: place.services,
      keywords: place.keywords,
    });
  };

  const filteredPlaces = ALL_SEARCHABLE_PLACES.filter((place) => {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    return (
      place.name.toLowerCase().includes(lowerQuery) ||
      place.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  }).slice(0, 15);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.8}
        onPress={handleOpen}
      >
        <Ionicons name="search" size={20} color={primaryColor} />
        <Text
          style={[
            styles.placeholder,
            query ? { color: lightColors.textH1 } : undefined,
          ]}
          numberOfLines={1}
        >
          {query ? query : "Buscar aquí..."}
        </Text>
        {query.length > 0 && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setQuery("");
              setFocusedPlace(null);
            }}
            style={{ padding: 4 }}
          >
            <X size={20} color="#999" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={isExpanded}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.expandedContainer}>
          <View
            style={[
              styles.headerBox,
              { paddingTop: Constants.statusBarHeight + 10 },
            ]}
          >
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={lightColors.textH1} />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.expandedInput}
              placeholder="Buscar lugares en la UNMSM..."
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  setFocusedPlace(null);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.resultsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {filteredPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.resultItem}
                onPress={() => handleSelectPlace(place)}
              >
                <View
                  style={[
                    styles.resultIconContainer,
                    { backgroundColor: `${primaryColor}1A` },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={primaryColor}
                  />
                </View>
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName}>{place.name}</Text>
                  <Text style={styles.resultCategory}>{place.schedule}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {filteredPlaces.length === 0 && (
              <Text style={styles.noResultsText}>No se encontraron lugares.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Constants.statusBarHeight + 15,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: lightColors.bg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  placeholder: {
    marginLeft: 12,
    color: lightColors.textGhostBtn,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    flex: 1,
  },
  expandedContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: lightColors.bg,
    zIndex: 100,
  },
  headerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightColors.bg,
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    marginRight: 12,
  },
  expandedInput: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textH1,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  resultIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
    color: lightColors.textH1,
  },
  resultCategory: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  noResultsText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
});
