import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { chatColors } from "../types";
import { lightColors } from "@/theme/light";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

/** Lista de chips de sugerencias mostrada debajo del input en estado idle. */
export function SuggestionChips({
  suggestions,
  onSelect,
}: SuggestionChipsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          accessibilityRole="button"
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          onPress={() => onSelect(suggestion)}
        >
          <Text style={styles.chipText}>{suggestion}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    backgroundColor: lightColors.bg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: lightColors.textGhostBtn,
  },
});
