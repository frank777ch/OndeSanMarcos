import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Button, ButtonVariant } from "@shared/components/Button";
import { lightColors } from "@/theme/light";
import type { OnboardingScreenProps } from "@navigation/types";
import LocationReview from "@/shared/assets/location-review.svg";
import ChatBot from "@/shared/assets/chat-bot.svg";
import NavigationCuate from "@/shared/assets/navigation-cuate.svg";
import Navigation from "@/shared/assets/navigation.svg";
import { primitive } from "@/theme/colors";

const pages: {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant: ButtonVariant;
  showLogin: boolean;
  showSkip: boolean;
  Image: React.ComponentType<{ width: number; height: number }>;
}[] = [
  {
    title: "Explora la UNMSM.",
    description:
      "Encuentra aulas, oficinas y servicios en segundos. Todo el campus en la palma de tu mano.",
    buttonText: "Comenzar",
    buttonVariant: "primary",   // azul — primer slide
    showLogin: true,
    showSkip: false,
    Image: LocationReview,
  },
  {
    title: "Llega sin perderte.",
    description:
      "Traza rutas hacia cualquier dependencia y muévete por la universidad de forma rápida y eficiente.",
    buttonText: "Siguiente",
    buttonVariant: "secondary", // gris — igual que "Iniciar sesión"
    showLogin: false,
    showSkip: true,
    Image: Navigation,
  },
  {
    title: "Sigue tu ruta en tiempo real.",
    description:
      "Visualiza el camino paso a paso dentro del campus con un mapa dinámico que te guía en todo momento.",
    buttonText: "Siguiente",
    buttonVariant: "secondary", // gris
    showLogin: false,
    showSkip: true,
    Image: NavigationCuate,
  },
  {
    title: "Resuelve tus dudas al instante.",
    description:
      "Consulta con nuestra IA horarios, ubicaciones o información de cualquier área de la universidad.",
    buttonText: "Continuar",
    buttonVariant: "primary",   // azul — último slide
    showLogin: false,
    showSkip: false,
    Image: ChatBot,
  },
];

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = pages[pageIndex];
  const PageImage = page.Image;

  const goToWelcome = () => navigation.navigate("Welcome");

  const goBack = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const goNext = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
    } else {
      goToWelcome();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {pageIndex > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {page.showSkip && (
          <TouchableOpacity onPress={goToWelcome} style={styles.skipButton}>
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido central */}
      <View style={styles.content}>
        <PageImage width={260} height={220} />
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {pageIndex > 0 && (
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
        )}

        <Button
          text={page.buttonText}
          variant={page.buttonVariant}
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
          onPress={goNext}
        />

        {page.showLogin && (
          <Button
            text="Iniciar sesión"
            variant="secondary"
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
            onPress={goToWelcome}
          />
        )}
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
    marginTop: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  backText: {
    color: lightColors.textLinkBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 22,
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
    marginBottom: 50,
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
    gap: 7,
    marginBottom: 45,
    marginTop: 16,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: primitive.alabastarGrey,
  },
  paginationDotActive: {
    width: 32,
    height: 10,
    borderRadius: 5,
    backgroundColor: primitive.tertiary,
  },
});