/**
 * components/StatBar.jsx
 * Two-stat summary bar — translated via useLanguage().
 */

import { View, Text, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { formatRupees } from "../lib/date";

export default function StatBar({ totalPending = 0, todayReceived = 0 }) {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.label}>{t.totalPending}</Text>
        <Text style={[styles.amount, { color: colors.danger }]}>
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stat: { flex: 1, paddingVertical: 14, alignItems: "center" },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: "400",
  },
  amount: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: 12 },
});
