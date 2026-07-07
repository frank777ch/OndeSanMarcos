import { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform, ToastAndroid, Alert } from "react-native";
import { Route, Road, Signpost, X, Map, Trash2 } from "lucide-react-native";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";

import { useMapStore } from "@/core/store/useMapStore";

interface MapActionButtonsProps {
  onModeSelect: (modo: "ninguno" | "libre" | "guia") => void;
  onStartRoute?: () => void;
  onStopRoute?: () => void;
  isRouteActive?: boolean;
  isGpsEnabled?: boolean;
}

export function MapActionButtons({
  onModeSelect,
  onStartRoute,
  onStopRoute,
  isRouteActive,
  isGpsEnabled,
}: MapActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const focusedPlace = useMapStore((s) => s.focusedPlace);

  const bottomPosition = focusedPlace ? 170 : 30;

  return (
    <View style={[styles.container, { bottom: bottomPosition }]}>
      {isRouteActive ? (
        <TouchableOpacity
          style={styles.whiteButton}
          activeOpacity={0.8}
          onPress={onStopRoute}
          accessibilityRole="button"
          accessibilityLabel="Cancelar ruta"
        >
          <Trash2 size={20} color="red" />
          <Text style={[styles.whiteText, { color: "red" }]}>
            Cancelar ruta
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.whiteButton}
          activeOpacity={0.8}
          onPress={onStartRoute}
          accessibilityRole="button"
          accessibilityLabel="Iniciar ruta"
        >
          <Route size={20} color={lightColors.textLinkBtn} />
          <Text style={styles.whiteText}>Iniciar ruta</Text>
        </TouchableOpacity>
      )}

      {isExpanded ? (
        <>
          <TouchableOpacity
            style={[styles.blueButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => {
              if (!isGpsEnabled) {
                if (Platform.OS === "android") {
                  ToastAndroid.show("Debes activar tu GPS para mayor precisión.", ToastAndroid.SHORT);
                } else {
                  Alert.alert("GPS desactivado", "Debes activar tu GPS para mayor precisión.");
                }
              }
              onModeSelect("libre");
            }}
            accessibilityRole="button"
            accessibilityLabel="Activar modo libre"
          >
            <Road size={20} color="#FFF" />
            <Text style={styles.blueText}>Modo libre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.blueButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => onModeSelect("guia")}
            accessibilityRole="button"
            accessibilityLabel="Activar modo de guía"
          >
            <Signpost size={20} color="#FFF" />
            <Text style={styles.blueText}>Modo de guía</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.blueButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => {
              onModeSelect("ninguno");
              setIsExpanded(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar los modos de seguimiento"
          >
            <X size={20} color="#FFF" />
            <Text style={styles.blueText}>Cerrar los modos</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.blueButton, { backgroundColor: primaryColor }]}
          activeOpacity={0.8}
          onPress={() => setIsExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Modos de seguimiento"
        >
          <Map size={20} color="#FFF" />
          <Text style={styles.blueText}>Modos de seguimiento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 10,
    alignItems: "flex-end",
    gap: 16,
  },
  whiteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightColors.bg,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  whiteText: {
    marginLeft: 8,
    color: lightColors.textLinkBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
  },
  blueButton: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: lightColors.bgPrimaryBtn, // Dynamic
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  blueText: {
    marginLeft: 8,
    color: lightColors.textPrimaryBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
  },
});
