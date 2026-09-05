/**
 * components/EmptyState.jsx
 * Shown on Home when no customers have pending udhar.
 */

import { View, Text, Image, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function EmptyState() {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>{t.noUdhar}</Text>
      <Text style={styles.sub}>{t.noUdharSub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  icon: { width: 48, height: 48, borderRadius: 14 },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
