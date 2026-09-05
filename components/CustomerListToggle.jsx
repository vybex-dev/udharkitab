/**
 * components/CustomerListToggle.jsx
 * Authentic Apple iOS Segmented Control with tactile feel and pill indicators.
 */

import { View, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { useLanguage } from "../contexts/LanguageContext";
import PressableScale from "./PressableScale";

export default function CustomerListToggle({ mode, onChange, pendingCount, settledCount }) {
  const { t } = useLanguage();
  const isPending = mode === "pending";

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <PressableScale
          containerStyle={styles.segmentBtn}
          style={[styles.segment, isPending && styles.segmentActive]}
          onPress={() => onChange("pending")}
          activeScale={0.98}
          hitSlop={0}
        >
          <Text
            style={[styles.text, isPending && styles.textActive]}
            numberOfLines={1}
          >
            {t.pendingTab || "Pending"}
          </Text>
          {typeof pendingCount === "number" && (
            <View style={[styles.badge, isPending ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, isPending && styles.badgeTextActive]}>
                {pendingCount}
              </Text>
            </View>
          )}
        </PressableScale>

        <PressableScale
          containerStyle={styles.segmentBtn}
          style={[styles.segment, !isPending && styles.segmentActive]}
          onPress={() => onChange("settled")}
          activeScale={0.98}
          hitSlop={0}
        >
          <Text
            style={[styles.text, !isPending && styles.textActive]}
            numberOfLines={1}
          >
            {t.settledTab || "Settled"}
          </Text>
          {typeof settledCount === "number" && (
            <View style={[styles.badge, !isPending ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, !isPending && styles.badgeTextActive]}>
                {settledCount}
              </Text>
            </View>
          )}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  track: {
    flexDirection: "row",
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    borderRadius: 14,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
  },
  segment: {
    flexDirection: "row",
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },
  textActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: colors.primaryLight,
  },
  badgeInactive: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  badgeTextActive: {
    color: colors.primary,
  },
});

