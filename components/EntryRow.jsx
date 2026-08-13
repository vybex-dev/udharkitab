/**
 * components/EntryRow.jsx
 * Single entry row — now shows due_date if set.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel, formatDate, todayISO } from "../lib/date";

export default function EntryRow({ entry, onSettle }) {
  const { t, language } = useLanguage();
  const { amount, note, date, settled, due_date, paid_amount } = entry;

  const paidAmount = paid_amount || 0;
  const remaining = amount - paidAmount;
  const isPartial = !settled && paidAmount > 0.009;

  // Is the due date today or overdue?
  const today = todayISO();
  const isDueToday = due_date && !settled && due_date === today;
  const isOverdue = due_date && !settled && due_date < today;

  return (
    <View style={[styles.row, settled ? styles.rowSettled : styles.rowPending]}>
      {/* Left */}
      <View style={styles.left}>
        <Text style={[styles.date, settled && styles.dateSettled]}>
          {relativeLabel(date, language)}
        </Text>
        {note ? (
          <Text
            style={[styles.note, settled && styles.noteSettled]}
            numberOfLines={2}
          >
            {note}
          </Text>
        ) : null}

        {/* Due date chip — only on unsettled entries */}
        {!settled && due_date && (
          <View
            style={[
              styles.dueDateChip,
              isDueToday && styles.dueDateChipToday,
              isOverdue && styles.dueDateChipOverdue,
            ]}
          >
            <Text
              style={[
                styles.dueDateChipText,
                isDueToday && styles.dueDateChipTextToday,
                isOverdue && styles.dueDateChipTextOverdue,
              ]}
            >
              {isOverdue
                ? `⚠️ ${t.overdueChip}`
                : isDueToday
                  ? `⏰ ${t.dueTodayChip}`
                  : `📅 ${formatDate(due_date, language)}`}
            </Text>
          </View>
        )}

        {!settled &&
          (isPartial ? (
            <View style={styles.partialPill}>
              <Text style={styles.partialPillText}>
                {t.partiallyPaidTag(
                  formatRupees(paidAmount),
                  formatRupees(amount),
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillText}>{t.pendingTag}</Text>
            </View>
          ))}
      </View>

      {/* Right */}
      <View style={styles.right}>
        <Text style={[styles.amount, settled && styles.amountSettled]}>
          {formatRupees(settled ? amount : remaining)}
        </Text>
        {settled ? (
          <View style={styles.settledBadge}>
            <Text style={styles.settledBadgeText}>{t.settledBadge}</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.settleBtn,
              pressed && styles.settleBtnPressed,
            ]}
            onPress={() => onSettle(entry.id)}
            hitSlop={6}
          >
            <Text style={styles.settleBtnText}>{t.settleBtn}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 16,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  rowPending: { borderLeftColor: colors.danger },
  rowSettled: {
    backgroundColor: colors.surface,
    opacity: 0.75,
    shadowOpacity: 0,
    elevation: 0,
  },
  left: { flex: 1, gap: 3 },
  date: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  dateSettled: { color: colors.textSecondary },
  note: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  noteSettled: { color: colors.textTertiary },

  // Due date chip
  dueDateChip: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueDateChipToday: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amber,
  },
  dueDateChipOverdue: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  dueDateChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dueDateChipTextToday: { color: colors.amber },
  dueDateChipTextOverdue: { color: colors.danger },

  pendingPill: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: 0.3,
  },

  partialPill: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: colors.amber,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  partialPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.amber,
    letterSpacing: 0.3,
  },

  right: { alignItems: "flex-end", gap: 8 },
  amount: { fontSize: 16, fontWeight: "700", color: colors.danger },
  amountSettled: {
    color: colors.textTertiary,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },

  settleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  settleBtnPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  settleBtnText: { fontSize: 13, fontWeight: "700", color: colors.white },

  settledBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  settledBadgeText: { fontSize: 12, fontWeight: "600", color: colors.success },
});
