import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@store/useAuthStore';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

export function AppNavigator() {
  const { session, isGuest, isLoading } = useAuthStore();

  if (isLoading) return null;

  const isAuthenticated = session !== null || isGuest;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}