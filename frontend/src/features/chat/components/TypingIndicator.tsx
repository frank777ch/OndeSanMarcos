import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { chatColors } from '../types';

const DOT_COUNT = 3;
const STEP_MS = 200;

/** Indicador animado de "escribiendo…" con tres puntos en rebote. */
export function TypingIndicator(): React.JSX.Element {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * STEP_MS),
          Animated.timing(dot, {
            toValue: 1,
            duration: STEP_MS,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: STEP_MS,
            useNativeDriver: true,
          }),
          Animated.delay((DOT_COUNT - 1 - index) * STEP_MS),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots]);

  return (
    <View style={styles.row} accessibilityLabel="El asistente está escribiendo">
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: chatColors.primary,
  },
});
