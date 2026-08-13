/**
 * components/analytics/PeriodComparisonCard.jsx
 * Reusable "this period vs last period" numbers card. No charts — just
 * figures with a +/- % delta, used for both the week and month views.
 */

import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { formatRupees } from "../../lib/date";
import { useLanguage } from "../../contexts/LanguageContext";

function pctChange(current, previous) {
  if (previous <= 0.009) return current > 0.009 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function DeltaText({ value }) {
  const isUp = value >= 0;
  const color = isUp ? colors.success : colors.danger;
  const arrow = isUp ? "↑" : "↓";
  return (
    <Text style={[styles.delta, { color }]}>
      {arrow} {Math.abs(value).toFixed(0)}%
    </Text>
  );
}

export default function PeriodComparisonCard({ title, comparison }) {
  const { t } = useLanguage();
  const {
    currentGiven,
    previousGiven,
    currentCollected,
    previousCollected,
    currentRate,
    previousRate,
  } = comparison;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.line}>
        <Text style={styles.label}>{t.givenLabel || "Given"}</Text>
        <View style={styles.valueGroup}>
          <Text style={styles.value}>{formatRupees(currentGiven)}</Text>
          <DeltaText value={pctChange(currentGiven, previousGiven)} />
        </View>
      </View>

      <View style={styles.line}>
        <Text style={styles.label}>{t.collectedLabel || "Collected"}</Text>
        <View style={styles.valueGroup}>
          <Text style={styles.value}>{formatRupees(currentCollected)}</Text>
          <DeltaText value={pctChange(currentCollected, previousCollected)} />
        </View>
      </View>

      <View style={styles.line}>
        <Text style={styles.label}>{t.collectionRateLabel || "Collection rate"}</Text>
        <View style={styles.valueGroup}>
          <Text style={styles.value}>{(currentRate * 100).toFixed(0)}%</Text>
          <DeltaText value={(currentRate - previousRate) * 100} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginHorizontal: 16,
    gap: 10,
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 13, color: colors.textSecondary },
  valueGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  delta: { fontSize: 12, fontWeight: "700", minWidth: 46, textAlign: "right" },
});
