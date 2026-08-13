/**
 * components/CustomerListToggle.jsx
 * Segmented Pending/Settled control shown at the top of the Home list.
 */

import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { useLanguage } from "../contexts/LanguageContext";

export default function CustomerListToggle({ mode, onChange, pendingCount, settledCount }) {
  const { t } = useLanguage();

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.segment, mode === "pending" && styles.segmentActive]}
        onPress={() => onChange("pending")}
      >
        <Text
          style={[styles.text, mode === "pending" && styles.textActive]}
          numberOfLines={1}
        >
          {t.pendingTab || "Pending"}
          {typeof pendingCount === "number" ? ` (${pendingCount})` : ""}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.segment, mode === "settled" && styles.segmentActive]}
        onPress={() => onChange("settled")}
      >
        <Text
          style={[styles.text, mode === "settled" && styles.textActive]}
          numberOfLines={1}
        >
          {t.settledTab || "Settled"}
          {typeof settledCount === "number" ? ` (${settledCount})` : ""}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  text: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  textActive: { color: colors.primary, fontWeight: "700" },
});
