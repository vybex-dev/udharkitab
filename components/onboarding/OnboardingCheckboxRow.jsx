/**
 * components/onboarding/OnboardingCheckboxRow.jsx
 * Themed checkbox row for onboarding consent steps (privacy policy,
 * cloud sync opt-in). Matches the rounded-card language used by the
 * theme-picker cards in app/onboarding/theme.jsx — square check box
 * instead of a radio, so it reads distinctly as "consent", not "choice".
 */

import { View, Text, Pressable, StyleSheet } from "react-native";

import { theme } from "../../constants/theme";

export default function OnboardingCheckboxRow({
  checked,
  onToggle,
  title,
  description,
  required = false,
  requiredLabel = "Required",
  children,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        checked && styles.cardChecked,
        pressed && styles.cardPressed,
      ]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Text style={styles.tick}>✓</Text> : null}
      </View>

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, checked && styles.titleChecked]}>
            {title}
          </Text>
          {required ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requiredLabel}</Text>
            </View>
          ) : null}
        </View>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.spacing.md,
  },
  cardChecked: {
    borderColor: theme.color.primary,
    backgroundColor: theme.color.primarySoft,
  },
  cardPressed: { opacity: 0.88 },

  box: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm - 2,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    backgroundColor: theme.color.surfaceCard,
  },
  boxChecked: {
    borderColor: theme.color.primary,
    backgroundColor: theme.color.primary,
  },
  tick: { color: theme.color.onPrimary, fontSize: 14, fontWeight: "800" },

  textWrap: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 15.5, fontWeight: "700", color: theme.color.textPrimary },
  titleChecked: { color: theme.color.primaryDeep },
  description: { fontSize: 13, color: theme.color.textSecondary, lineHeight: 18.5 },

  badge: {
    backgroundColor: theme.color.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: theme.color.amber },
});
