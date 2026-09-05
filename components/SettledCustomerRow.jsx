/**
 * components/SettledCustomerRow.jsx
 * Row shown in the Home screen's "Settled" tab — a fully-paid-off customer.
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AvatarCircle from "./AvatarCircle";
import PressableScale from "./PressableScale";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel } from "../lib/date";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettledCustomerRow({ customer }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { id, name, total_settled, last_settled_date } = customer;

  return (
    <PressableScale
      style={styles.row}
      onPress={() => router.push(`/customer/${id}`)}
      activeScale={0.98}
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
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  right: { alignItems: "flex-end", gap: 4 },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: -0.1,
  },
});
