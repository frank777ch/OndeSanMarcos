import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";

import { useThemeStore } from "@/core/store/useThemeStore";
import { primitive } from "@/theme/colors";
import type { ApkRelease } from "@shared/utils/appRelease";

type Props = {
  otaReady: boolean;
  onApplyOta: () => void;
  apkRelease: ApkRelease | null;
};

/**
 * Aviso flotante de actualización. Prioriza el APK nuevo (cambio nativo)
 * porque una OTA no puede llegar a un build viejo incompatible.
 */
export function UpdateBanner({ otaReady, onApplyOta, apkRelease }: Props) {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  let message: string;
  let action: string;
  let onAction: () => void;

  if (apkRelease) {
    message = "Hay una nueva versión de la app para instalar.";
    action = "Descargar";
    onAction = () => {
      Linking.openURL(apkRelease.apkUrl).catch(() => {});
    };
  } else if (otaReady) {
    message = "Hay una actualización lista.";
    action = "Reiniciar";
    onAction = onApplyOta;
  } else {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: primaryColor }]}
      accessibilityRole="alert"
    >
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onAction}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={action}
      >
        <Text style={[styles.actionText, { color: primaryColor }]}>{action}</Text>
      </Pressable>
      <Pressable
        onPress={() => setDismissed(true)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
      >
        <Text style={styles.close}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Constants.statusBarHeight + 8,
    left: 12,
    right: 12,
    zIndex: 1000,
    elevation: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  message: {
    flex: 1,
    color: primitive.white,
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
  },
  action: {
    backgroundColor: primitive.white,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
  close: {
    color: primitive.white,
    fontSize: 16,
  },
});
