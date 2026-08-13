/**
 * components/SettledCustomerRow.jsx
 * Row shown in the Home screen's "Settled" tab — a fully-paid-off customer.
 */

import { Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AvatarCircle from "./AvatarCircle";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel } from "../lib/date";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettledCustomerRow({ customer }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { id, name, total_settled, last_settled_date } = customer;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(`/customer/${id}`)}
      android_ripple={{ color: colors.border }}
    >
      <AvatarCircle name={name} size={44} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.date}>
          {last_settled_date
            ? relativeLabel(last_settled_date, language)
            : t.settledBadge || "Settled"}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatRupees(total_settled)}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t.settledBadge || "✓ Settled"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pressed: { backgroundColor: colors.surface },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textSecondary },
  right: { alignItems: "flex-end", gap: 4 },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.success },
});
