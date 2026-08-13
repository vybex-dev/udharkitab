/**
 * components/analytics/SnapshotCard.jsx
 * Top-of-page totals: outstanding, overdue, all-time collected.
 */

import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { formatRupees } from "../../lib/date";
import { useLanguage } from "../../contexts/LanguageContext";

export default function SnapshotCard({ snapshot }) {
  const { t } = useLanguage();
  const { totalOutstanding, totalOverdue, overdueCustomerCount, totalCollectedAllTime } =
    snapshot;

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>{t.totalOutstanding || "Outstanding"}</Text>
        <Text style={[styles.value, { color: colors.danger }]}>
          {formatRupees(totalOutstanding)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t.totalOverdue || "Overdue"}</Text>
        <Text style={[styles.value, { color: colors.amber }]}>
          {formatRupees(totalOverdue)}
        </Text>
        {overdueCustomerCount > 0 && (
          <Text style={styles.sub}>
            {overdueCustomerCount} {t.customersWord || "customers"}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t.totalCollected || "Collected (all-time)"}</Text>
        <Text style={[styles.value, { color: colors.success }]}>
          {formatRupees(totalCollectedAllTime)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  label: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  value: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 10, color: colors.textTertiary },
});
