import { View, Text, StyleSheet } from "react-native";

// Refined Apple/Linear-grade tinted badge palettes (bg, text, border)
const AVATAR_PALETTE = [
  { bg: "#EEF2FF", text: "#4F46E5", border: "rgba(79, 70, 229, 0.14)" }, // Indigo
  { bg: "#FFF1F2", text: "#E11D48", border: "rgba(225, 29, 72, 0.14)" }, // Rose
  { bg: "#ECFDF5", text: "#059669", border: "rgba(5, 150, 105, 0.14)" }, // Emerald
  { bg: "#FEF3C7", text: "#D97706", border: "rgba(217, 119, 6, 0.14)" }, // Amber
  { bg: "#F0F9FF", text: "#0284C7", border: "rgba(2, 132, 199, 0.14)" }, // Sky
  { bg: "#F5F3FF", text: "#7C3AED", border: "rgba(124, 58, 237, 0.14)" }, // Violet
  { bg: "#F0FDFA", text: "#0D9488", border: "rgba(13, 148, 136, 0.14)" }, // Teal
];

function getTheme(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export default function AvatarCircle({
  name = "",
  size = 44,
  elevated = false,
}) {
  const theme = getTheme(name);
  const firstChar = name.trim().charAt(0).toUpperCase() || "?";
  const fontSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.circle,
        elevated && styles.circleElevated,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.36), // Apple squircle ratio
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize, color: theme.text }]}>
        {firstChar}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  // Subtle ambient lift for hero profile badges
  circleElevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  letter: {
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
