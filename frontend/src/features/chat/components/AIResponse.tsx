import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { chatColors } from "../types";

interface AIResponseProps {
  content: string;
}

/** Respuesta de la IA: texto directo sobre el fondo, sin burbuja. */
export function AIResponse({ content }: AIResponseProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 6,
    paddingRight: 24,
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: chatColors.textAIResponse,
  },
});
