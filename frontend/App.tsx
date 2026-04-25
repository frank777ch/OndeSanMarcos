import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@providers/AuthProvider';
import { AppNavigator } from '@navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}