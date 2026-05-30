import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useAuthStore } from "@store/useAuthStore";
import { supabase } from "@services/supabase/client";
import { Input } from "@shared/components/Input";
import { Button } from "@shared/components/Button";
import { lightColors } from "@theme/light";
import type { EditProfileScreenProps } from "@navigation/types";

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { session } = useAuthStore();
  const currentName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.user_metadata?.name ??
    "";
  const email = session?.user?.email ?? "";

  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, name: name },
      });

      if (error) throw error;

      Alert.alert("Éxito", "Perfil actualizado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar el perfil";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Input
            label="Nombre completo"
            value={name}
            onChangeText={setName}
            placeholder="Ejem. Juan Pérez"
          />
          <Input
            label="Correo electrónico"
            inputType="email"
            value={email}
            onChangeText={() => {}}
            placeholder="correo@ejemplo.com"
            editable={false}
            inputWrapperStyle={styles.emailInputWrapper}
          />
        </View>

        <Button
          text={loading ? "Guardando..." : "Guardar cambios"}
          variant="primary"
          style={styles.saveBtn}
          loading={loading}
          onPress={handleSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: lightColors.bgContainer,
  },
  scroll: {
    flexGrow: 1,
    padding: 36,
    gap: 36,
  },
  form: {
    gap: 24,
  },
  saveBtn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
  },
  emailInputWrapper: {
    backgroundColor: "#F5F5F5",
  },
});
