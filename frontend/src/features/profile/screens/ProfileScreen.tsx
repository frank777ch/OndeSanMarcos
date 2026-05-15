import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@store/useAuthStore";
import { authService } from "@services/supabase/auth.service";
import { lightColors } from "@theme/light";
import { Button } from "@shared/components/Button";
import { SettingsItem } from "@shared/components/SettingsItem";
import { HatGlasses, Palette, Bell, LogOut } from "lucide-react-native";
import { primitive } from "@/theme/colors";

export function ProfileScreen() {
  const { session, isGuest, clear } = useAuthStore();

  const displayName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.email?.split("@")[0] ??
    "";
  const initial = displayName.charAt(0).toUpperCase() || "?";
  const email = session?.user?.email ?? "";

  async function handleLogout() {
    Alert.alert(
      isGuest ? "Salir" : "Cerrar sesión",
      isGuest
        ? "¿Quieres volver a la pantalla de inicio?"
        : "¿Estás seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: isGuest ? "Salir" : "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              if (!isGuest) await authService.signOut();
              clear();
            } catch {
              clear();
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.userInfoContainer}>
        <View>
          <View style={styles.avatarCircle}>
            {isGuest ? (
              <HatGlasses
                color={lightColors.bgPrimaryBtn}
                size={48}
                strokeWidth={1.5}
              />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
        </View>

        <View style={styles.userInfoText}>
          <Text style={styles.name}>
            {isGuest ? "Invitado" : displayName || email}
          </Text>

          {!isGuest && <Text style={styles.email}>{email}</Text>}
        </View>

        <View style={styles.btnWrapper}>
          <Button
            text={isGuest ? "Iniciar sesión" : "Editar perfil"}
            variant="primary"
            style={styles.actionBtn}
            onPress={() => {
              if (isGuest) {
                /* navegar a login */
              } else {
                /* navegar a editar */
              }
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <SettingsItem
          icon={<Palette color="#1A1A2E" size={22} strokeWidth={1.8} />}
          title="Tema"
          description="Predeterminado del sistema"
          onPress={() => {}}
        />

        <SettingsItem
          icon={<Bell color="#1A1A2E" size={22} strokeWidth={1.8} />}
          title="Notificaciones"
          description="Recordatorios diarios."
          onPress={() => {}}
        />

        <SettingsItem
          icon={<LogOut color="#EF4444" size={22} strokeWidth={1.8} />}
          title={`${isGuest ? "Volver a inicio" : "Cerrar sesión"}`}
          destructive
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: lightColors.bgContainer,
  },
  container: {
    alignItems: "center",
    padding: 36,
    paddingTop: 72,
    gap: 36,
  },

  userInfoContainer: {
    gap: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarCircle: {
    minWidth: 120,
    minHeight: 120,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: lightColors.bgPrimaryBtn,
    backgroundColor: primitive.ghostWhite,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitial: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 40,
    color: lightColors.bgPrimaryBtn,
    lineHeight: 48,
  },

  userInfoText: {
    gap: 8,
  },

  name: {
    fontFamily: "FunnelDisplay_700Bold",
    fontSize: 24,
    color: lightColors.textH1,
    textAlign: "center",
  },
  email: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: lightColors.textPrimaryP,
    textAlign: "center",
  },

  btnWrapper: {
    width: "100%",
  },

  actionBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },

  section: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },

  sectionTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 18,
    color: lightColors.textPrimaryP,
    marginBottom: 12,
  },
});
