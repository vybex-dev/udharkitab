/**
 * components/analytics/MonthlyHistoryList.jsx
 * Simple month-by-month table: given / collected / net for each of the
 * last N months. No charts, just rows.
 */

import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { formatRupees } from "../../lib/date";
import { useLanguage } from "../../contexts/LanguageContext";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatYearMonth(ym) {
  if (!ym) return "";
  const [year, month] = ym.split("-");
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[idx] ?? month} ${year}`;
}

export default function MonthlyHistoryList({ months }) {
  const { t } = useLanguage();

  if (!months || months.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.monthlyHistoryTitle || "Last 6 Months"}</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.monthCell]}>
          {t.monthColumn || "Month"}
        </Text>
        <Text style={[styles.headerCell, styles.numCell]}>
          {t.givenLabel || "Given"}
        </Text>
        <Text style={[styles.headerCell, styles.numCell]}>
          {t.collectedLabel || "Collected"}
        </Text>
      </View>

      {months.map((m) => (
        <View key={m.yearMonth} style={styles.row}>
          <Text style={[styles.cell, styles.monthCell]}>
            {formatYearMonth(m.yearMonth)}
          </Text>
          <Text style={[styles.cell, styles.numCell]}>
            {formatRupees(m.given)}
          </Text>
          <Text style={[styles.cell, styles.numCell, { color: colors.success }]}>
            {formatRupees(m.collected)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    padding: 14,
    gap: 4,
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 2,
  },
  headerCell: { fontSize: 11, fontWeight: "700", color: colors.textTertiary },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  cell: { fontSize: 13, color: colors.textPrimary },
  monthCell: { flex: 1.2 },
  numCell: { flex: 1, textAlign: "right" },
});
