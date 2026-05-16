import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuthStore } from "@store/useAuthStore";
import type { WelcomeScreenProps } from "@navigation/types";
import { Button } from "@shared/components/Button";
import { lightColors } from "@/theme/light";

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { setGuest } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        <Text style={styles.title}>¿Listo para explorar?</Text>
        <Text style={styles.description}>
          Accede a todas las funcionalidades y comienza a moverte por la
          universidad sin complicaciones.
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.actionsSection}>
          <Button
            text="Iniciar sesión"
            variant="primary"
            style={styles.fullWidth}
            textStyle={{
              fontSize: 18,
            }}
            onPress={() => navigation.navigate("Login")}
          />
          <Button
            text="Registrarse"
            variant="secondary"
            style={styles.fullWidth}
            textStyle={{
              fontSize: 18,
            }}
            onPress={() => navigation.navigate("Register")}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>También puedes</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          text="Continuar como invitado"
          variant="link"
          textStyle={styles.guestLinkText}
          onPress={() => setGuest(true)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
    gap: 48,
  },

  textSection: {
    alignItems: "center",
    gap: 24,
  },
  title: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 48,
    color: lightColors.textH1,
    textAlign: "center",
    lineHeight: 56,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: lightColors.textPrimaryP,
    textAlign: "center",
    lineHeight: 24,
  },

  actionsContainer: {
    gap: 36,
    width: "100%",
  },

  // ── Botones
  actionsSection: {
    width: "100%",
    gap: 16,
  },
  fullWidth: {
    width: "100%",
    height: 52,
    borderRadius: 16,
  },

  // ── Separador
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 36,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    borderRadius: 8,
    backgroundColor: lightColors.strokeInfo,
  },
  dividerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textInfoP,
  },

  // ── Link
  guestLinkText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 18,
    color: lightColors.textLinkBtn,
  },
});
