/**
 * components/pending/OverdueModal.jsx
 * Bottom-sheet modal listing every overdue customer, shown from
 * OverdueBanner when there's more than one to choose from.
 */

import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from "react-native";

import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatRupees } from "../../lib/date";

export default function OverdueModal({
  visible,
  onClose,
  overdueCustomers,
  onSelectCustomer,
}) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop backdrop press from bubbling into the sheet */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>⚠️ {t.overdueModalTitle}</Text>
          <Text style={styles.subtitle}>{t.overdueModalSubtitle}</Text>

          <ScrollView
            style={styles.list}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {overdueCustomers.map((c, idx) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                  idx === overdueCustomers.length - 1 && styles.rowLast,
                ]}
                onPress={() => onSelectCustomer(c.id)}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {c.name.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{c.name}</Text>
                  <Text style={styles.rowOverdue}>
                    {t.overdueEntryCount(c.overdue_count)}
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{formatRupees(c.pending)}</Text>
                  <Text style={styles.rowArrow}>›</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t.close}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.4,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: "#FFF1F2" },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFE4E6",
    borderWidth: 1.5,
    borderColor: "#FECDD3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.danger,
  },

  rowInfo: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rowOverdue: { fontSize: 12, color: colors.danger, marginTop: 2 },

  rowRight: { alignItems: "flex-end", gap: 2 },
  rowAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.3,
  },
  rowArrow: { fontSize: 18, color: colors.textTertiary, fontWeight: "600" },

  closeBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
