/**
 * components/pending/DueTodayStrip.jsx
 * Horizontal scroll strip of customers whose payment is due today,
 * shown between the stat bar and sort pills on the Pending list.
 */

import { View, Text, ScrollView, StyleSheet } from "react-native";

import PressableScale from "../PressableScale";
import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatRupees } from "../../lib/date";

export default function DueTodayStrip({ dueToday, onSelectCustomer }) {
  const { t } = useLanguage();

  if (dueToday.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⏰</Text>
        <Text style={styles.headerTitle}>{t.dueTodaySection}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{dueToday.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {dueToday.map((customer) => (
          <PressableScale
            key={customer.id}
            style={styles.card}
            onPress={() => onSelectCustomer(customer.id)}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {customer.name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer.name}
            </Text>
            <Text style={styles.amount}>{formatRupees(customer.pending)}</Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.18)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  headerIcon: { fontSize: 16 },
  headerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.amber,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    flex: 1,
  },
  badge: {
    backgroundColor: colors.amber,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.white },

  scroll: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },

  card: {
    alignItems: "center",
    backgroundColor: colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
    minWidth: 92,
  },

  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 18, fontWeight: "800", color: colors.white },
  customerName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    maxWidth: 86,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  amount: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.2,
  },
});
