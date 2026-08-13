/**
 * components/onboarding/ApprovalStamp.jsx
 * Same stamp-landing animation as before — just restyled with the new
 * theme's success colors and softer, rounder badge shape to match the
 * mockups' overall look (rounded-full pills, subtle borders).
 */

import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { theme } from "../../constants/theme";

export default function ApprovalStamp({ visible, label = "Saved" }) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      rotate.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-10deg", "-6deg"],
  });

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ scale }, { rotate: spin }] }]}
      pointerEvents="none"
    >
      <View style={styles.badge}>
        <Text style={styles.check}>✓</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", marginTop: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.color.successLight,
    borderWidth: 1,
    borderColor: theme.color.success,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  check: { color: theme.color.success, fontWeight: "900", fontSize: 13 },
  label: {
    color: theme.color.success,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
