import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '@store/useAuthStore';
import { authService } from '@services/supabase/auth.service';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';

export function ProfileScreen() {
  const { session, isGuest, clear } = useAuthStore();

  async function handleLogout() {
    Alert.alert(
      isGuest ? 'Salir' : 'Cerrar sesión',
      isGuest
        ? '¿Quieres volver a la pantalla de inicio?'
        : '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isGuest ? 'Salir' : 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!isGuest) await authService.signOut();
              clear();
            } catch {
              clear(); // limpiar igual si falla
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {isGuest ? '👤' : (session?.user?.email?.[0].toUpperCase() ?? '?')}
        </Text>
      </View>

      {/* Info usuario */}
      <Text style={styles.name}>
        {isGuest ? 'Invitado' : session?.user?.email}
      </Text>
      <Text style={styles.badge}>
        {isGuest ? 'Sin cuenta' : 'Estudiante UNMSM'}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Info extra solo si está logueado */}
      {!isGuest && (
        <View style={styles.infoCard}>
          <Row label="Correo" value={session?.user?.email ?? '—'} />
          <Row label="Estado" value="Verificado ✅" />
        </View>
      )}

      {/* Mensaje invitado */}
      {isGuest && (
        <View style={styles.guestCard}>
          <Text style={styles.guestCardText}>
            🔒 Crea una cuenta para guardar tu historial de rutas y acceder al asistente IA completo.
          </Text>
        </View>
      )}

      {/* Botón logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>
          {isGuest ? '← Volver al inicio' : 'Cerrar sesión'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingTop: 80,
    padding: 32,
    gap: 12,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.bold,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  badge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  guestCard: {
    width: '100%',
    backgroundColor: Colors.accentLight + '33',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  guestCardText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 'auto',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
});