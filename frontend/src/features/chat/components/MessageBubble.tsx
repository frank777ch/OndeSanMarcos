import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { chatColors } from "../types";
import { useThemeStore } from "@/core/store/useThemeStore";

interface MessageBubbleProps {
  content: string;
}

/** Burbuja de un mensaje del usuario: alineada a la derecha, fondo azul oscuro. */
export function MessageBubble({
  content,
}: MessageBubbleProps): React.JSX.Element {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, { backgroundColor: primaryColor }]}>
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginVertical: 6,
  },
  bubble: {
    maxWidth: "82%",
    backgroundColor: chatColors.userBubble,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    lineHeight: 21,
    color: chatColors.surface,
  },
});
