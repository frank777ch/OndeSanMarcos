import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";

const FILTERS = [
  {
    id: "1",
    label: "Facultades",
    value: "Facultades",
    icon: "business-outline",
  },
  { id: "2", label: "Cafeterías", value: "Cafeterias", icon: "cafe-outline" },
  { id: "3", label: "Auditorios", value: "Auditorios", icon: "mic-outline" },
  {
    id: "4",
    label: "Campos deportivos",
    value: "Campos deportivos",
    icon: "football-outline",
  },
  { id: "5", label: "Puertas", value: "Puertas", icon: "log-in-outline" },
];

interface MapFilterChipsProps {
  activeFilter: string | null;
  onFilterChange: (filter: string) => void;
}

export function MapFilterChips({
  activeFilter,
  onFilterChange,
}: MapFilterChipsProps) {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.chip, isActive && [styles.chipActive, { backgroundColor: primaryColor }]]}
              activeOpacity={0.8}
              onPress={() => onFilterChange(filter.value)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${filter.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={isActive ? "#FFFFFF" : "#4A4A4A"}
              />
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Constants.statusBarHeight + 80,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightColors.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chipActive: {
    // backgroundColor: lightColors.bgPrimaryBtn, // Dynamic
  },
  chipText: {
    marginLeft: 8,
    color: lightColors.textGhostBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
});
