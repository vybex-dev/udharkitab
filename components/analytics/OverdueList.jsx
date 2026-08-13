/**
 * components/analytics/OverdueList.jsx
 * Customers with overdue entries, sorted by longest-overdue first.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { formatRupees } from "../../lib/date";
import { useLanguage } from "../../contexts/LanguageContext";
import AvatarCircle from "../AvatarCircle";

export default function OverdueList({ overdue }) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!overdue || overdue.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{t.overdueListTitle || "Overdue"}</Text>
        <Text style={styles.emptyText}>
          {t.noOverdueCustomers || "No overdue customers right now 🎉"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.overdueListTitle || "Overdue"}</Text>
      {overdue.map((c, idx) => (
        <Pressable
          key={c.id}
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
            idx === overdue.length - 1 && styles.rowLast,
          ]}
          onPress={() => router.push(`/customer/${c.id}`)}
        >
          <AvatarCircle name={c.name} size={34} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.overdueCount}>
              {t.overdueEntryCount
                ? t.overdueEntryCount(c.overdue_count)
                : `${c.overdue_count} overdue item(s)`}
            </Text>
          </View>
          <Text style={styles.amount}>{formatRupees(c.pending)}</Text>
        </Pressable>
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
    gap: 2,
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  rowPressed: { backgroundColor: colors.surface },
  rowLast: { borderBottomWidth: 0 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  overdueCount: { fontSize: 11, color: colors.danger, marginTop: 1 },
  amount: { fontSize: 14, fontWeight: "700", color: colors.danger },
});
