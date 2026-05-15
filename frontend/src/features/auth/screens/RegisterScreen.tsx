import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { authService } from "@services/supabase/auth.service";
import { Input } from "@shared/components/Input";
import { Button } from "@shared/components/Button";
import { AuthHeader } from "@shared/components/AuthHeader";
import { lightColors } from "@theme/light";
import type { RegisterScreenProps } from "@navigation/types";
import EnterEmailSvg from "@shared/assets/enter-email.svg";

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /*const { width } = useWindowDimensions();
  const svgWidth = Math.min(210, width * 0.5);
  const svgHeight = svgWidth * (230 / 210);*/

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    try {
      setLoading(true);
      await authService.signUp(email.trim(), password, name.trim());
      navigation.navigate("EmailSent", { email: email.trim() });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al registrarse";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader onBack={() => navigation.navigate("Welcome")} />

        <View style={styles.illustrationWrapper}>
          <EnterEmailSvg />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>
            {"Crea tu cuenta en\n"}
            <Text style={styles.titleBold}>OndeSanMarcos.</Text>
          </Text>
          <Text style={styles.description}>Regístrate para empezar.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nombre"
            inputType="text"
            value={name}
            onChangeText={setName}
            placeholder="Ejem. Juan"
          />
          <Input
            label="Correo electrónico"
            inputType="email"
            value={email}
            onChangeText={setEmail}
            placeholder="Ejem. juan@example.com"
          />
          <Input
            label="Contraseña"
            inputType="password"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
          />
        </View>

        <Button
          text={loading ? "Registrando..." : "Registrar"}
          variant="primary"
          loading={loading}
          style={styles.submitBtn}
          textStyle={{ fontSize: 18 }}
          onPress={handleRegister}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: lightColors.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: 36,
    gap: 36,
  },

  // ── Ilustración
  illustrationWrapper: {
    alignItems: "center",
  },

  // ── Texto
  textSection: {
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontFamily: "FunnelDisplay_400Regular",
    fontSize: 36,
    color: lightColors.textH1,
    textAlign: "center",
    lineHeight: 44,
  },
  titleBold: {
    fontFamily: "FunnelDisplay_700Bold",
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 18,
    color: lightColors.textPrimaryP,
    textAlign: "center",
    lineHeight: 26,
  },

  // ── Formulario
  form: {
    gap: 24,
  },

  // ── Registrar
  submitBtn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
  },
});
