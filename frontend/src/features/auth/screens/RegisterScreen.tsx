import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '@services/supabase/auth.service';
import { AuthHeader } from '@shared/components/AuthHeader';
import { AuthTextInput } from '@shared/components/AuthTextInput';
import { IllustrationPlaceholder } from '@shared/components/IllustrationPlaceholder';
import { PrimaryButton } from '@shared/components/PrimaryButton';
import { StepDots } from '@shared/components/StepDots';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';
import type { RegisterScreenProps } from '@navigation/types';

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      await authService.signUp(email.trim(), password, name.trim());
      navigation.navigate('EmailSent', { email: email.trim() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader />

        <View style={styles.headerArea}>
          <IllustrationPlaceholder label="REGISTER" size={150} />
          <View style={styles.dotsWrap}>
            <StepDots total={4} active={0} />
          </View>
        </View>

        <Text style={styles.title}>
          Crea tu cuenta en{'\n'}
          <Text style={styles.titleAccent}>OndeSanMarcos.</Text>
        </Text>
        <Text style={styles.subtitle}>Regístrate para empezar.</Text>

        <View style={styles.fields}>
          <AuthTextInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <AuthTextInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthTextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <PrimaryButton
          title="Registrar"
          onPress={handleRegister}
          loading={loading}
          style={styles.submit}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerArea: {
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  dotsWrap: {
    marginTop: 4,
  },
  title: {
    marginTop: 24,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  titleAccent: {
    color: Colors.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fields: {
    marginTop: 28,
    gap: 14,
  },
  submit: {
    marginTop: 24,
  },
  link: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: FontSize.sm,
    marginTop: 18,
    fontWeight: FontWeight.semibold,
  },
});
