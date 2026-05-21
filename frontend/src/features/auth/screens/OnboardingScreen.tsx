import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Button } from "@shared/components/Button";
import { lightColors } from "@/theme/light";
import type { OnboardingScreenProps } from "@navigation/types";

const pages = [
  {
    title: "Explora la UNMSM",
    description:
      "Conoce el campus, ubica servicios y descubre todo lo que la universidad tiene para ti.",
    buttonText: "Comenzar",
    showLogin: true,
  },
  {
    title: "Explora rutas y espacios",
    description:
      "Encuentra los mejores recorridos y sitios importantes para moverte por la UNMSM.",
    buttonText: "Siguiente",
    showLogin: false,
  },
  {
    title: "¿Listo para explorar?",
    description:
      "Accede a todas las funcionalidades y comienza a moverte por la universidad sin complicaciones.",
    buttonText: "Continuar",
    showLogin: false,
  },
];

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = pages[pageIndex];

  const goToWelcome = () => navigation.navigate("Welcome");
  const goNext = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
      return;
    }
    goToWelcome();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View />
        {pageIndex < pages.length - 1 ? (
          <TouchableOpacity onPress={goToWelcome} style={styles.skipButton}>
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </View>

      <View style={styles.footer}>
        <Button
          text={page.buttonText}
          variant="primary"
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
          onPress={goNext}
        />

        {page.showLogin ? (
          <Button
            text="Iniciar sesión"
            variant="secondary"
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
            onPress={goToWelcome}
          />
        ) : null}

        <View style={styles.paginationRow}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === pageIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bg,
    padding: 28,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  skipText: {
    color: lightColors.textLinkBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  title: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 44,
    color: lightColors.textH1,
    textAlign: "center",
    lineHeight: 50,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: lightColors.textPrimaryP,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    gap: 16,
  },
  primaryButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 18,
  },
  secondaryButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
  },
  secondaryButtonText: {
    fontSize: 18,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: lightColors.strokeInfo,
  },
  paginationDotActive: {
    backgroundColor: lightColors.bgPrimaryBtn,
  },
});