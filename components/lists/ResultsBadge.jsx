/**
 * components/lists/ResultsBadge.jsx
 * "X results" / "no results" strip shown under the search bar while
 * the user is actively searching. Shared by Pending and Settled.
 */

import { Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ResultsBadge({ visible, resultCount }) {
  const { t } = useLanguage();
  if (!visible) return null;

  const noResults = resultCount === 0;

  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.resultsBadge}>
      <Ionicons
        name={noResults ? "alert-circle-outline" : "people"}
        size={13}
        color={colors.primary}
      />
      <Text style={styles.resultsBadgeText} numberOfLines={1}>
        {noResults ? t.noResultsBadge : t.resultsBadge(resultCount)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  resultsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  resultsBadgeText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primary,
  },
});
