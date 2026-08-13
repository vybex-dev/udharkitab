/**
 * components/AvatarCircle.jsx
 * Colored circle showing the first letter of a customer name.
 * Color is deterministic based on the name string.
 */

import { View, Text, StyleSheet } from "react-native";

// Palette of avatar background colors — muted, readable
const AVATAR_COLORS = [
  "#D4A5F5", // lavender
  "#F5A5C0", // pink
  "#A5C8F5", // blue
  "#A5F5C8", // mint
  "#F5D4A5", // peach
  "#A5F5F5", // cyan
  "#F5F5A5", // yellow
  "#C8A5F5", // purple
];

function getColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AvatarCircle({
  name = "",
  size = 44,
  elevated = false,
}) {
  const bg = getColor(name);
  const firstChar = name.trim().charAt(0).toUpperCase() || "?";
  const fontSize = Math.round(size * 0.4);

  return (
    <View
      style={[
        styles.circle,
        elevated && styles.circleElevated,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize }]}>{firstChar}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  // Subtle lift used where the avatar sits on its own (e.g. profile hero)
  circleElevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  letter: {
    fontWeight: "700",
    color: "#2A2A2A",
    letterSpacing: 0.2,
  },
});
