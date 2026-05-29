import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { chatColors } from '../types';

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
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        {isLoading ? (
          <ActivityIndicator color={chatColors.surface} size="small" />
        ) : (
          <Send color={chatColors.surface} size={18} strokeWidth={2.2} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: chatColors.surface,
    borderRadius: 28,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: chatColors.textPrimary,
    paddingVertical: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: chatColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
