/**
 * components/EntryRow.jsx
 * Single entry row — now shows due_date if set.
 */

import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import PressableScale from "./PressableScale";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel, formatDate, todayISO } from "../lib/date";

export default function EntryRow({ entry, onSettle, isLast }) {
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
    <View
      style={[
        styles.row,
        settled ? styles.rowSettled : styles.rowPending,
        !isLast && styles.rowDivider,
      ]}
    >
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
            <Ionicons
              name={
                isOverdue ? "alert-circle" : isDueToday ? "time" : "calendar"
              }
              size={11}
              color={
                isOverdue
                  ? colors.danger
                  : isDueToday
                    ? colors.amber
                    : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.dueDateChipText,
                isDueToday && styles.dueDateChipTextToday,
                isOverdue && styles.dueDateChipTextOverdue,
              ]}
            >
              {isOverdue
                ? t.overdueChip
                : isDueToday
                  ? t.dueTodayChip
                  : formatDate(due_date, language)}
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
          <PressableScale
            style={styles.settleBtn}
            onPress={() => onSettle(entry.id)}
            activeScale={0.94}
            hitSlop={8}
          >
            <Text style={styles.settleBtnText}>{t.settleBtn}</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sits inside the shared entriesCard container (see [id].jsx) — no own
  // margin, radius, border or shadow. isFirst/isLast round only the outer
  // corners of the group, and rowDivider draws the hairline between rows.
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    gap: 12,
    borderLeftWidth: 3.5,
    borderLeftColor: "transparent",
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  rowPending: { borderLeftColor: colors.danger },
  rowSettled: {
    backgroundColor: colors.surfaceHover || "#F8FAFC",
  },
  left: { flex: 1, gap: 4 },
  date: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  dateSettled: { color: colors.textSecondary },
  note: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  noteSettled: { color: colors.textTertiary },

  // Due date chip
  dueDateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueDateChipToday: {
    backgroundColor: colors.amberLight,
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  dueDateChipOverdue: {
    backgroundColor: colors.dangerLight,
    borderColor: "rgba(225, 29, 72, 0.25)",
  },
  dueDateChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dueDateChipTextToday: { color: colors.amber, fontWeight: "700" },
  dueDateChipTextOverdue: { color: colors.danger, fontWeight: "700" },

  pendingPill: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    borderColor: "rgba(217, 119, 6, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  partialPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.amber,
    letterSpacing: 0.3,
  },

  right: { alignItems: "flex-end", gap: 8 },
  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.3,
  },
  amountSettled: {
    color: colors.textTertiary,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },

  settleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  settleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.2,
  },

  settledBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  settledBadgeText: { fontSize: 12, fontWeight: "700", color: colors.success },
});
