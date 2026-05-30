import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Send } from "lucide-react-native";
import { chatColors } from "../types";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  isLoading?: boolean;
}

/** Input de texto blanco redondeado con botón de envío azul circular. */
export function ChatInput({
  value,
  onChangeText,
  onSend,
  placeholder,
  isLoading = false,
}: ChatInputProps): React.JSX.Element {
  const canSend = value.trim().length > 0 && !isLoading;
  const primaryColor = useThemeStore((s) => s.primaryColor);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={chatColors.placeholder}
        multiline
        returnKeyType="send"
        onSubmitEditing={() => {
          if (canSend) onSend();
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar mensaje"
        style={[
          styles.sendButton,
          !canSend && styles.sendButtonDisabled,
          { backgroundColor: primaryColor },
        ]}
        onPress={onSend}
        disabled={!canSend}
      >
        {isLoading ? (
          <ActivityIndicator color={chatColors.surface} size={18} />
        ) : (
          <Send color={chatColors.surface} size={20} strokeWidth={2.2} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: lightColors.bg,
    borderColor: lightColors.strokePrimaryBtn,
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: chatColors.textPrimary,
    paddingVertical: 8,
    maxHeight: 120,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: lightColors.bgPrimaryBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
