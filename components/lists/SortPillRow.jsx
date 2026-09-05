/**
 * components/lists/SortPillRow.jsx
 * Row of pill buttons for switching sort order, e.g. Highest / Recent
 * / Name. Shared by Pending and Settled — each screen owns its own
 * sort state and just passes the current value + options in.
 */

import { View, Text, StyleSheet } from "react-native";

import PressableScale from "../PressableScale";
import { colors } from "../../constants/colors";

export default function SortPillRow({ options, activeSort, onChange }) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => (
        <PressableScale
          key={opt.key}
          style={[styles.pill, activeSort === opt.key && styles.pillActive]}
          onPress={() => onChange(opt.key)}
        >
          <Text
            style={[
              styles.pillText,
              activeSort === opt.key && styles.pillTextActive,
            ]}
            numberOfLines={1}
          >
            {opt.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexShrink: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  pillTextActive: { color: colors.primary, fontWeight: "700" },
});
