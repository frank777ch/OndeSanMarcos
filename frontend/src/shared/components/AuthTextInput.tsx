import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@constants/colors';
import { FontSize } from '@constants/typography';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function AuthTextInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: Props) {
  const [focused, setFocused] = useState(false);
  const float = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(float, {
      toValue: focused || value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [focused, value, float]);

  const labelStyle = {
    top: float.interpolate({ inputRange: [0, 1], outputRange: [18, 6] }),
    fontSize: float.interpolate({
      inputRange: [0, 1],
      outputRange: [FontSize.md, FontSize.xs],
    }),
    color: float.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.textDisabled, Colors.primary],
    }),
  };

  return (
    <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
      <Animated.Text style={[styles.label, labelStyle]} pointerEvents="none">
        {label}
      </Animated.Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        selectionColor={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 8,
    minHeight: 60,
    justifyContent: 'flex-end',
  },
  wrapperFocused: {
    borderColor: Colors.primary,
  },
  label: {
    position: 'absolute',
    left: 14,
    fontWeight: '500',
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
  },
});
