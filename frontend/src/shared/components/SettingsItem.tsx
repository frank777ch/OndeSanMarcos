import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { lightColors } from "@theme/light";

type SettingsItemProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress?: () => void;
  destructive?: boolean;
  style?: ViewStyle;
};

export function SettingsItem({
  icon,
  title,
  description,
  onPress,
  destructive = false,
  style,
}: SettingsItemProps) {
  const titleColor = destructive ? "#EF4444" : lightColors.textH1;
  const iconTintStyle = destructive ? { color: "#EF4444" } : {};

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View
        style={[
          styles.iconWrapper,
          destructive && styles.iconWrapperDestructive,
        ]}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
              color: destructive
                ? "#EF4444"
                : (icon as React.ReactElement<{ color?: string }>).props.color,
            })
          : icon}
      </View>

      <View style={styles.textWrapper}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {description !== undefined && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightColors.bg,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
    // sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperDestructive: {
    // sin fondo especial, solo color del ícono
  },
  textWrapper: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    fontWeight: "600",
    color: lightColors.textH1,
    lineHeight: 22,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: lightColors.textPrimaryP,
    lineHeight: 20,
  },
});
