import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthHeader } from '@shared/components/AuthHeader';
import { IllustrationPlaceholder } from '@shared/components/IllustrationPlaceholder';
import { PrimaryButton } from '@shared/components/PrimaryButton';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';
import type { VerifiedEmailScreenProps } from '@navigation/types';

export function VerifiedEmailScreen({ navigation }: VerifiedEmailScreenProps) {
  return (
    <View style={styles.container}>
      <AuthHeader onBack={() => navigation.replace('Login')} />
      <View style={styles.content}>
        <IllustrationPlaceholder label="ENVELOPE+CHECK" size={200} />
        <Text style={styles.title}>Correo verificado.</Text>
        <Text style={styles.subtitle}>
          Tu correo ha sido verificado correctamente.
        </Text>
      </View>
      <PrimaryButton title="Continuar" onPress={() => navigation.replace('Login')} />
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
});
