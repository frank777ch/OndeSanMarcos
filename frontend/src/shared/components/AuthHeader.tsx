import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@constants/colors';

type Props = {
  onBack?: () => void;
};

export function AuthHeader({ onBack }: Props) {
  const navigation = useNavigation();
  const handleBack = onBack ?? (() => navigation.goBack());

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleBack}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        style={styles.button}
      >
        <Text style={styles.icon}>‹</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
});
