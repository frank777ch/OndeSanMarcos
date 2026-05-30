import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightColors } from "@theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";

// Custom Switch Component
interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ value, onValueChange }) => {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        switchStyles.track,
        value ? [switchStyles.trackActive, { backgroundColor: primaryColor, borderColor: primaryColor }] : switchStyles.trackInactive
      ]}
    >
      <View
        style={[
          switchStyles.thumb,
          value ? switchStyles.thumbActive : switchStyles.thumbInactive
        ]}
      />
    </TouchableOpacity>
  );
};

const switchStyles = StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  trackInactive: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#A0A0A0",
  },
  trackActive: {
    borderWidth: 2,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  thumbInactive: {
    backgroundColor: "#A0A0A0",
    alignSelf: "flex-start",
  },
  thumbActive: {
    backgroundColor: "white",
    alignSelf: "flex-end",
  },
});

export function NotificationsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>General</Text>

      <View style={styles.optionsContainer}>
        <View style={styles.optionRow}>
          <View style={styles.leftContent}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={lightColors.textH1}
            />
            <Text style={styles.optionLabel}>Permitir notificaciones</Text>
          </View>
          
          <CustomSwitch 
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>
      </View>

      <Text style={styles.description}>
        Activa esta opción para recibir alertas importantes sobre la aplicación
        y el campus.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bgContainer,
    padding: 24,
  },
  sectionTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textPrimaryP,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  optionsContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textH1,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: lightColors.textPrimaryP,
    marginTop: 16,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
});
