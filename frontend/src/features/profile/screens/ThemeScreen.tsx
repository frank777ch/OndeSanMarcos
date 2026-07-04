import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightColors } from "@theme/light";
import { primitive } from "@/theme/colors";
import { useThemeStore } from "@/core/store/useThemeStore";

export function ThemeScreen() {
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >("system");
  const [isColorModalVisible, setColorModalVisible] = useState(false);

  const selectedAccent = useThemeStore((s) => s.primaryColor);
  const setSelectedAccent = useThemeStore((s) => s.setPrimaryColor);

  const themes = [
    { id: "light", label: "Claro", icon: "sunny-outline" },
    { id: "dark", label: "Oscuro", icon: "moon-outline" },
    {
      id: "system",
      label: "Predeterminado del sistema",
      icon: "phone-portrait-outline",
    },
  ] as const;

  const accentColors = [
    { id: "primary", color: primitive.primary },
    { id: "secondary", color: "#81433D" },
    { id: "tertiary", color: "#654885" },
    { id: "quaternary", color: "#054D49" },
  ];

  return (
    <View style={styles.container}>
      {/*<Text style={styles.sectionTitle}>Modo de visualización</Text>

      <View style={styles.optionsContainer}>
        {themes.map((theme, index) => {
          const isSelected = selectedTheme === theme.id;
          return (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.optionBtn,
                index === 0 && styles.firstOption,
                index === themes.length - 1 && styles.lastOption,
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedTheme(theme.id)}
            >
              <View style={styles.leftContent}>
                <Ionicons
                  name={theme.icon as any}
                  size={22}
                  color={lightColors.textH1}
                />
                <Text style={styles.optionLabel}>{theme.label}</Text>
              </View>

              <View
                style={[styles.radioCircle, { borderColor: selectedAccent }]}
              >
                {isSelected && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: selectedAccent },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>*/}

      <Text style={[styles.sectionTitle]}>Personalización</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionBtn, styles.firstOption, styles.lastOption]}
          activeOpacity={0.7}
          onPress={() => setColorModalVisible(true)}
        >
          <View style={styles.leftContent}>
            <Ionicons
              name="color-palette-outline"
              size={22}
              color={lightColors.textH1}
            />
            <Text style={styles.optionLabel}>Color principal</Text>
          </View>

          <View style={styles.currentColorCircle}>
            <View
              style={[styles.colorDot, { backgroundColor: selectedAccent }]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* MODAL DE SELECCIÓN DE COLOR */}
      <Modal
        visible={isColorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setColorModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Elige un color principal</Text>

                <View style={styles.colorsContainer}>
                  {accentColors.map((accent) => {
                    const isSelected = selectedAccent === accent.color;
                    return (
                      <TouchableOpacity
                        key={accent.id}
                        style={[
                          styles.colorBtn,
                          { backgroundColor: accent.color },
                          isSelected && styles.colorBtnSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedAccent(accent.color);
                          setColorModalVisible(false);
                        }}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={24} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.bgContainer,
    padding: 24,
  },
  sectionTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textPrimaryP,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  optionsContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "white",
  },
  firstOption: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  lastOption: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: lightColors.textH1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  currentColorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lightColors.bgContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 20,
    color: lightColors.textH1,
    marginBottom: 24,
  },
  colorsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  colorBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorBtnSelected: {
    borderWidth: 4,
    borderColor: "rgba(0,0,0,0.1)",
  },
});
