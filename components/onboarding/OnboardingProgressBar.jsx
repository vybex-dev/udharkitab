/**
 * components/onboarding/OnboardingProgressBar.jsx
 * Restyled to match the mockups: a single hairline track spanning the
 * top of the screen, with a filled bar animating to the current step's
 * percentage — e.g. "step 2 of 6" fills to 33%. Replaces the old
 * per-step segmented pill row.
 */

import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useSegments } from "expo-router";

import { ONBOARDING_STEPS, stepIndex } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";

export default function OnboardingProgressBar() {
  const segments = useSegments();
  const currentKey = segments[segments.length - 1];
  const currentIndex = Math.max(0, stepIndex(currentKey));
  const total = ONBOARDING_STEPS.length;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (currentIndex + 1) / total,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    height: 2,
    backgroundColor: theme.color.surfaceElevated,
  },
  fill: {
    height: "100%",
    backgroundColor: theme.color.primary,
  },
});
