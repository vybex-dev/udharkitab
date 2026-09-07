/**
 * components/lists/NoSearchResults.jsx
 * Empty state shown when a search query on the Pending/Settled list
 * matches nothing — distinct from each screen's "no customers at all"
 * empty state (EmptyState / SettledEmptyState).
 */

import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";

export default function NoSearchResults({ query }) {
  const { t } = useLanguage();
  return (
    <View style={styles.noResults}>
      <Ionicons
        name="search"
        size={36}
        color={colors.textTertiary}
        style={styles.noResultsIcon}
      />
      <Text style={styles.noResultsTitle}>{t.noResultsTitle(query)}</Text>
      <Text style={styles.noResultsSub}>{t.noResultsSub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  noResultsIcon: { marginBottom: 4 },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
