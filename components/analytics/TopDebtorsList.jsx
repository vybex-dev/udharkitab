/**
 * components/analytics/TopDebtorsList.jsx
 * Sorted list of customers with the highest pending amounts.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { formatRupees } from "../../lib/date";
import { useLanguage } from "../../contexts/LanguageContext";
import AvatarCircle from "../AvatarCircle";

export default function TopDebtorsList({ debtors }) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!debtors || debtors.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.topDebtorsTitle || "Top Debtors"}</Text>
      {debtors.map((c, idx) => (
        <Pressable
          key={c.id}
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
            idx === debtors.length - 1 && styles.rowLast,
          ]}
          onPress={() => router.push(`/customer/${c.id}`)}
        >
          <Text style={styles.rank}>{idx + 1}</Text>
          <AvatarCircle name={c.name} size={34} />
          <Text style={styles.name} numberOfLines={1}>
            {c.name}
          </Text>
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
  rank: { width: 16, fontSize: 12, color: colors.textTertiary, fontWeight: "700" },
  name: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  amount: { fontSize: 14, fontWeight: "700", color: colors.danger },
});
