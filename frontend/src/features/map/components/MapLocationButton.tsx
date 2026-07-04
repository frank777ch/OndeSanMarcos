import { TouchableOpacity, Text, StyleSheet, ToastAndroid, Platform, Alert } from "react-native";
import { Locate, LocateOff } from "lucide-react-native";
import Constants from "expo-constants";
import { lightColors } from "@/theme/light";

interface MapLocationButtonProps {
  disabled?: boolean;
  onPress?: () => void;
}

export function MapLocationButton({ disabled, onPress }: MapLocationButtonProps) {
  const Icon = disabled ? LocateOff : Locate;

  const handlePress = () => {
    if (disabled) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Debes activar tu GPS para usar esta función.", ToastAndroid.SHORT);
      } else {
        Alert.alert("GPS desactivado", "Debes activar tu GPS para usar esta función.");
      }
      return;
    }
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Icon size={20} color={disabled ? "#A0A0A0" : lightColors.textGhostBtn} />
      <Text style={[styles.text, disabled && styles.textDisabled]}>Mi ubicación</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    // Se coloca debajo de los chips de filtro
    top: Constants.statusBarHeight + 140,
    right: 20,
    zIndex: 10,

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
  buttonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  text: {
    marginLeft: 8,
    color: lightColors.textGhostBtn,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  textDisabled: {
    color: "#A0A0A0",
  },
});
