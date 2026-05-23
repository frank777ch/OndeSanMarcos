import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Locate } from "lucide-react-native";
import Constants from "expo-constants";
import { lightColors } from "@/theme/light";

export function MapLocationButton() {
  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={() => console.log("Centrar en mi ubicación")}
    >
      <Locate size={20} color={lightColors.textGhostBtn} />
      <Text style={styles.text}>Mi ubicación</Text>
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
  text: {
    marginLeft: 8,
    color: lightColors.textGhostBtn,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
});
