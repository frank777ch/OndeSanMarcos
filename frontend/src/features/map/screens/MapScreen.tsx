import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';

export function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ Mapa 3D</Text>
      <Text style={styles.sub}>Mapbox se integra aquí</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});