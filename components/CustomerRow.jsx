/**
 * components/CustomerRow.jsx
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AvatarCircle from "./AvatarCircle";
import PressableScale from "./PressableScale";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel } from "../lib/date";
import { useLanguage } from "../contexts/LanguageContext";

export default function CustomerRow({ customer }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { id, name, pending, last_entry_date } = customer;

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
          {relativeLabel(last_entry_date, language)}
        </Text>
      </View>

      <Text style={styles.amount}>{formatRupees(pending)}</Text>
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
  amount: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: -0.4,
  },
});
