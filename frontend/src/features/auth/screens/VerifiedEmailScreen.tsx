import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { VerifiedEmailScreenProps } from "@navigation/types";
import { lightColors } from "@theme/light";
import VerifiedEmail from "@shared/assets/mail-sent.svg";
import { Button } from "@shared/components/Button";

export function VerifiedEmailScreen({ navigation }: VerifiedEmailScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.illustrationWrapper}>
          <VerifiedEmail />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>Correo verificado.</Text>
          <Text style={styles.subtitle}>
            Tú correo ha sido verificado correctamente.
          </Text>
        </View>
        <Button
          text="Continuar"
          variant="primary"
          style={styles.continueBtn}
          textStyle={{ fontSize: 18 }}
          onPress={() => navigation.replace("Login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bg,
    padding: 36,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 48,
  },

  // ── Ilustración
  illustrationWrapper: {
    alignItems: "center",
  },

  // ── Texto
  textSection: {
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 36,
    color: lightColors.textH1,
    textAlign: "center",
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 18,
    color: lightColors.textPrimaryP,
    textAlign: "center",
    lineHeight: 26,
  },

  // ── Botón continuar
  continueBtn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
  },
});
