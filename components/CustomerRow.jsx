/**
 * components/CustomerRow.jsx
 */

import { Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AvatarCircle from "./AvatarCircle";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel } from "../lib/date";
import { useLanguage } from "../contexts/LanguageContext";

export default function CustomerRow({ customer }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { id, name, pending, last_entry_date } = customer;

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
          {relativeLabel(last_entry_date, language)}
        </Text>
      </View>

      <Text style={styles.amount}>{formatRupees(pending)}</Text>
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
  amount: { fontSize: 16, fontWeight: "700", color: colors.danger },
});
