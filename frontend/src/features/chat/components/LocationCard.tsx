import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { chatColors, type LocationResult } from "../types";
import { lightColors } from "@/theme/light";

interface LocationCardProps {
  location: LocationResult;
  onOpen: (location: LocationResult) => void;
}

/** Card blanca con ícono de mapa, nombre del lugar y botón "Abrir". */
export function LocationCard({
  location,
  onOpen,
}: LocationCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <MapPin color={lightColors.textH1} size={20} strokeWidth={2} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {location.name}
        </Text>
        {location.schedule ? (
          <Text style={styles.schedule} numberOfLines={1}>
            {location.schedule}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${location.name} en el mapa`}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => onOpen(location)}
      >
        <Text style={styles.buttonText}>Abrir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: chatColors.surface,
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: chatColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: chatColors.textPrimary,
  },
  schedule: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: chatColors.textSecondary,
  },
  button: {
    backgroundColor: lightColors.bgSecondaryBtn,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: lightColors.strokePrimaryBtn,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: lightColors.textSecondaryBtn,
  },
});
