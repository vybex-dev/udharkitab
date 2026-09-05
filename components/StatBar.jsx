/**
 * components/StatBar.jsx
 * Two-stat summary bar — translated via useLanguage().
 */

import { View, Text, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { formatRupees } from "../lib/date";

export default function StatBar({
  totalPending = 0,
  todayReceived = 0,
  leftLabel,
  leftColor = colors.danger,
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.label}>{leftLabel ?? t.totalPending}</Text>
        <Text style={[styles.amount, { color: leftColor }]}>
          {formatRupees(totalPending)}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.label}>{t.todayReceived}</Text>
        <Text style={[styles.amount, { color: colors.success }]}>
          {formatRupees(todayReceived)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  amount: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginVertical: 14,
  },
});
