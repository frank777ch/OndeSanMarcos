import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@constants/colors';
import { FontSize, FontWeight } from '@constants/typography';

type Props = {
  label?: string;
  size?: number;
};

// TODO: replace with designer-provided <Image source={require('@assets/...')}/> once available.
export function IllustrationPlaceholder({ label = 'ILUSTRACIÓN', size = 180 }: Props) {
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 12 },
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  text: {
    color: Colors.textDisabled,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
});
