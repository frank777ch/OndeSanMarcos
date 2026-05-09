import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthHeader } from '@shared/components/AuthHeader';
import { IllustrationPlaceholder } from '@shared/components/IllustrationPlaceholder';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';
import type { EmailSentScreenProps } from '@navigation/types';

export function EmailSentScreen({ route, navigation }: EmailSentScreenProps) {
  const email = route.params?.email;

  return (
    <View style={styles.container}>
      <AuthHeader />
      <View style={styles.content}>
        <IllustrationPlaceholder label="PAPER PLANE" size={200} />
        <Text style={styles.title}>Verifica tu correo.</Text>
        <Text style={styles.subtitle}>
          Te enviamos un enlace a {email ?? 'tu correo'}. Ábrelo y haz clic para
          activar tu cuenta.
        </Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Volver a iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  link: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
