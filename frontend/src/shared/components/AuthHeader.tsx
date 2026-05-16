import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";
import { lightColors } from "@theme/light";

type Props = {
  onBack?: () => void;
};

export function AuthHeader({ onBack }: Props) {
  const navigation = useNavigation();
  const handleBack = onBack ?? (() => navigation.goBack());

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <ChevronLeft size={24} color={lightColors.textH1} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
  },
  button: {
    marginTop: 4,
    width: 36,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  buttonPressed: {
    backgroundColor: lightColors.bgContainer,
  },
});
