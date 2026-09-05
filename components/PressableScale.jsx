/**
 * components/PressableScale.jsx
 *
 * Implements Emil Kowalski's tactile press feedback recipe for Expo:
 * - Immediate physical feedback on press-in, commit on press-out
 * - Subtle scale (default 0.97) in 120ms with strong UI ease-out: cubic-bezier(0.23, 1, 0.32, 1)
 * - hitSlop={12} to ensure >= 44x44pt touch geometry without inflating visual layout
 * - pressRetentionOffset={16} so minor finger drift does not cancel intentional presses
 * - Zero React re-renders on press: animated on UI thread via Reanimated
 */

import React, { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Emil Kowalski's strong ease-out for UI interactions
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function PressableScale({
  children,
  onPress,
  onPressIn,
  onPressOut,
  style,
  activeScale = 0.97,
  pressDuration = 120,
  releaseDuration = 140,
  hitSlop = 12,
  pressRetentionOffset = 16,
  disabled = false,
  containerStyle,
  ...restProps
}) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(
    (e) => {
      if (!disabled) {
        scale.set(
          withTiming(activeScale, {
            duration: pressDuration,
            easing: EASE_OUT,
          }),
        );
      }
      if (onPressIn) onPressIn(e);
    },
    [disabled, activeScale, pressDuration, onPressIn, scale],
  );

  const handlePressOut = useCallback(
    (e) => {
      if (!disabled) {
        scale.set(
          withTiming(1, { duration: releaseDuration, easing: EASE_OUT }),
        );
      }
      if (onPressOut) onPressOut(e);
    },
    [disabled, releaseDuration, onPressOut, scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      disabled={disabled}
      style={containerStyle}
      {...restProps}
    >
      <Animated.View style={[styles.box, animatedStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    // Keeps layout intact and prepares transform layer
  },
});
