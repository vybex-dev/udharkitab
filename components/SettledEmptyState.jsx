/**
 * components/SettledEmptyState.jsx
 * Shown on the Settled tab when no customers have been fully paid off yet.
 * Mirrors EmptyState.jsx's layout but uses the app mark in a soft circular
 * badge, matching the Settled tab's brand color (green/success).
 */

import { View, Text, Image, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function SettledEmptyState() {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Image
          source={require("../assets/settled-mark.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>
        {t.noSettledCustomersTitle || "No settled customers yet"}
      </Text>
      <Text style={styles.sub}>
        {t.noSettledCustomersSub ||
          "Customers show up here once all their udhar is cleared."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 36,
    gap: 8,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: "rgba(22, 163, 74, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  icon: { width: 44, height: 38 },
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
