/**
 * components/pending/OverdueBanner.jsx
 * Red warning banner shown above the Pending list when one or more
 * customers have overdue entries. Tapping it goes straight to the
 * customer's profile if there's only one, otherwise the caller should
 * open OverdueModal to let the user pick.
 */

import { View, Text, StyleSheet } from "react-native";

import PressableScale from "../PressableScale";
import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";

export default function OverdueBanner({ overdueCustomers, onPress }) {
  const { t } = useLanguage();

  if (overdueCustomers.length === 0) return null;
  const isSingle = overdueCustomers.length === 1;

  return (
    <PressableScale style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {isSingle
              ? t.overdueBannerSingle(overdueCustomers[0].name)
              : t.overdueBannerMultiple(overdueCustomers.length)}
          </Text>
          <Text style={styles.sub}>
            {isSingle ? t.overdueBannerSubSingle : t.overdueBannerSubMultiple}
          </Text>
        </View>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF1F2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.15)",
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: { fontSize: 20 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 12,
    color: "#E11D48",
    opacity: 0.85,
    marginTop: 2,
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 18,
  },
});
