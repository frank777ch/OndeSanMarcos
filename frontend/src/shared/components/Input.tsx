import React, { useRef, useState } from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { lightColors } from "@theme/light";

export type InputVariant = "with-label" | "without-label" | "input-icon";

export type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "phone"
  | "url"
  | "search";

export type InputValidation = {
  message: string;
  isValid: boolean;
};

type InputProps = Omit<
  TextInputProps,
  "style" | "keyboardType" | "autoCapitalize" | "secureTextEntry"
> & {
  variant?: InputVariant;
  label?: string;
  icon?: React.ReactNode;
  inputType?: InputType;
  validation?: InputValidation;
  containerStyle?: ViewStyle;
  inputWrapperStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  validationStyle?: TextStyle;
};

// ─── Helpers

type ResolvedInputTypeConfig = {
  keyboardType: KeyboardTypeOptions;
  autoCapitalize: "none" | "sentences" | "words" | "characters";
  secureTextEntry: boolean;
};

function resolveInputTypeConfig(type: InputType): ResolvedInputTypeConfig {
  switch (type) {
    case "email":
      return {
        keyboardType: "email-address",
        autoCapitalize: "none",
        secureTextEntry: false,
      };
    case "password":
      return {
        keyboardType: "default",
        autoCapitalize: "none",
        secureTextEntry: true,
      };
    case "number":
      return {
        keyboardType: "numeric",
        autoCapitalize: "none",
        secureTextEntry: false,
      };
    case "phone":
      return {
        keyboardType: "phone-pad",
        autoCapitalize: "none",
        secureTextEntry: false,
      };
    case "url":
      return {
        keyboardType: "url",
        autoCapitalize: "none",
        secureTextEntry: false,
      };
    case "search":
      return {
        keyboardType: "web-search",
        autoCapitalize: "none",
        secureTextEntry: false,
      };
    default: // 'text'
      return {
        keyboardType: "default",
        autoCapitalize: "sentences",
        secureTextEntry: false,
      };
  }
}

export function Input({
  variant = "with-label",
  label,
  icon,
  inputType = "text",
  validation,
  containerStyle,
  inputWrapperStyle,
  labelStyle,
  inputStyle,
  validationStyle,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const typeConfig = resolveInputTypeConfig(inputType);

  const hasError = validation !== undefined && !validation.isValid;
  const hasSuccess = validation !== undefined && validation.isValid;

  // StyleSheet.flatten
  const resolvedContainer = StyleSheet.flatten([
    styles.container,
    containerStyle,
  ]);

  const resolvedLabel = StyleSheet.flatten([styles.label, labelStyle]);

  const resolvedWrapper = StyleSheet.flatten([
    styles.inputWrapper,
    focused && styles.inputWrapperFocused,
    hasError && styles.inputWrapperError,
    hasSuccess && styles.inputWrapperSuccess,
    inputWrapperStyle,
  ]);

  const resolvedInput = StyleSheet.flatten([
    styles.input,
    variant === "input-icon" && styles.inputWithIcon,
    inputStyle,
  ]);

  const resolvedValidation = StyleSheet.flatten([
    styles.validationText,
    hasError ? styles.validationError : styles.validationSuccess,
    validationStyle,
  ]);

  return (
    <View style={resolvedContainer}>
      {variant === "with-label" && label ? (
        <Text style={resolvedLabel}>{label}</Text>
      ) : null}

      {/* Wrapper del input */}
      <View style={resolvedWrapper}>
        <TextInput
          ref={inputRef}
          style={resolvedInput}
          placeholderTextColor={lightColors.textGhostBtn}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={lightColors.bgPrimaryBtn}
          // Props derivadas del inputType (se pueden sobreescribir con textInputProps)
          keyboardType={typeConfig.keyboardType}
          autoCapitalize={typeConfig.autoCapitalize}
          secureTextEntry={typeConfig.secureTextEntry}
          {...textInputProps}
        />

        {variant === "input-icon" && icon ? (
          <View style={styles.iconWrapper}>{icon}</View>
        ) : null}
      </View>

      {validation?.message ? (
        <Text style={resolvedValidation}>{validation.message}</Text>
      ) : null}
    </View>
  );
}

// ─── Styles

const ERROR_COLOR = "#D93025";
const SUCCESS_COLOR = "#209743ff";

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
  },

  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 18,
    lineHeight: 20,
    color: lightColors.textLinkBtn,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: lightColors.bg,
    borderWidth: 1,
    borderColor: lightColors.strokePrimaryBtn,
    borderRadius: 16,
    shadowColor: "rgba(26, 26, 26, 0.04)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },

  inputWrapperFocused: {
    borderColor: lightColors.bgPrimaryBtn,
  },

  inputWrapperError: {
    borderColor: ERROR_COLOR,
  },

  inputWrapperSuccess: {
    borderColor: SUCCESS_COLOR,
  },

  input: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 18,
    lineHeight: 24,
    color: lightColors.textH1,
    paddingVertical: 12,
    padding: 0,
  },

  inputWithIcon: {
    paddingRight: 8,
  },

  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },

  // Mensaje de validación base
  validationText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },

  validationError: {
    color: ERROR_COLOR,
  },

  validationSuccess: {
    color: SUCCESS_COLOR,
  },
});
