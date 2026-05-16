import React from 'react';
import * as Linking from 'expo-linking';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@store/useAuthStore';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import type { AuthStackParamList } from './types';

const linking: LinkingOptions<AuthStackParamList> = {
  prefixes: [Linking.createURL('/'), 'ondesanmarcos://'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      EmailSent: 'email-sent',
      VerifiedEmail: 'verified-email',
    },
  },
};

export function AppNavigator() {
  const { session, isGuest, isLoading } = useAuthStore();

  if (isLoading) return null;

  const isAuthenticated = session !== null || isGuest;

  return (
    <>
      <StatusBar style="dark" translucent={false} />
      <NavigationContainer linking={linking} fallback={null}>
        {isAuthenticated ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
}