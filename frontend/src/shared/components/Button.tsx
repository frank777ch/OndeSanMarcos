import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";

type ButtonProps = {
  text: string;
  onPress: () => void;
  variant?: ButtonVariant;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  text,
  onPress,
  variant = "primary",
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const primaryColor = useThemeStore((s) => s.primaryColor);
  const isDisabled = loading || disabled;

  const dynamicStyle =
    variant === "primary" ? { backgroundColor: primaryColor } : {};

  const containerStyle = [
    styles.base,
    variantStyles[variant].container,
    dynamicStyle,
    isDisabled && styles.disabled,
    style,
  ];

  // StyleSheet.flatten: Une todos los estilos en uno solo.
  const labelStyle = StyleSheet.flatten([
    styles.label,
    variantStyles[variant].label,
    textStyle,
  ]);

  const spinnerColor = variantSpinnerColor[variant];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {iconLeft && <View style={styles.iconWrapper}>{iconLeft}</View>}
          <Text style={labelStyle}>{text}</Text>
          {iconRight && <View style={styles.iconWrapper}>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Variants

const variantSpinnerColor: Record<ButtonVariant, string> = {
  primary: lightColors.textPrimaryBtn,
  secondary: lightColors.textSecondaryBtn,
  ghost: lightColors.textGhostBtn,
  link: lightColors.textLinkBtn,
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    // shadow (Figma spec)
    shadowColor: "rgba(26, 26, 26, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    lineHeight: 20,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; label: TextStyle }
> = {
  // ── Primary
  primary: {
    container: {
      backgroundColor: lightColors.bgPrimaryBtn,
      borderWidth: 0,
    },
    label: {
      color: lightColors.textPrimaryBtn,
    },
  },

  // ── Secondary
  secondary: {
    container: {
      backgroundColor: lightColors.bgSecondaryBtn,
      borderWidth: 1,
      borderColor: lightColors.strokePrimaryBtn,
    },
    label: {
      color: lightColors.textSecondaryBtn,
    },
  },

  // ── Ghost
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 0,
      // Sin shadow para ghost
      shadowOpacity: 0,
      elevation: 0,
    },
    label: {
      color: lightColors.textGhostBtn,
    },
  },

  // ── Link
  link: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
      paddingHorizontal: 0,
      height: "auto" as unknown as number,
    },
    label: {
      color: lightColors.textLinkBtn,
      textDecorationLine: "underline",
    },
  },
};
