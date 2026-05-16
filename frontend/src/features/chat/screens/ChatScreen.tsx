import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { lightColors } from "@/theme/light";

export function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Asistente IA</Text>
      <Text style={styles.sub}>Chat con RAG</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bgContainer,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontSize: 36,
    fontFamily: "FunnelDisplay_700Bold",
    color: lightColors.bgPrimaryBtn,
  },
  sub: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: lightColors.textInfoP,
  },
});
