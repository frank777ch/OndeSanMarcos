import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@store/useAuthStore';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';
import type { WelcomeScreenProps } from '@navigation/types';

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { setGuest } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OndeSanMarcos</Text>
      <Text style={styles.subtitle}>Navega el campus de la UNMSM</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setGuest(true)}>
        <Text style={styles.guestText}>Continuar como Invitado</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.accent,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.textOnPrimary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textOnPrimary,
  },
  guestText: {
    marginTop: 16,
    fontSize: FontSize.sm,
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
});