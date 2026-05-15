import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthHeader } from "@shared/components/AuthHeader";
import type { EmailSentScreenProps } from "@navigation/types";
import SentEmail from "@shared/assets/message-sent.svg";
import { lightColors } from "@theme/light";

export function EmailSentScreen({ route, navigation }: EmailSentScreenProps) {
  const email = route.params?.email;

  return (
    <View style={styles.container}>
      <AuthHeader onBack={() => navigation.goBack()} />

      <View style={styles.centerContent}>
        <View style={styles.illustrationWrapper}>
          <SentEmail />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>Verifica tu correo.</Text>
          <Text style={styles.subtitle}>
            Te enviamos un enlace a {email ?? "tu correo"}. Ábrelo y haz clic
            para activar tu cuenta.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bg,
    padding: 48,
  },


  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 36,
  },

  illustrationWrapper: {
    alignItems: "center",
  },
  textSection: {
    alignItems: "center",
    gap: 24,
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
});
