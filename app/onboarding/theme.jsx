/**
 * app/onboarding/theme.jsx
 * Step 3 of onboarding — theme preference.
 * Restyled cards to match the mockup's theme-swatch rows (mini preview
 * thumbnail + label + radio). UdharKitab still only ships Light today,
 * so Dark stays selectable-but-labeled "Soon" as before.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useOnboarding } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";

const THEME_OPTIONS = [
  {
    code: "light",
    label: "Light",
    sub: "Clean and bright",
    swatchBg: "#FFFFFF",
    swatchBar: "#F8F9FA",
    comingSoon: false,
  },
  {
    code: "dark",
    label: "Dark",
    sub: "Easy on the eyes — coming soon",
    swatchBg: "#191C1D",
    swatchBar: "#2E3132",
    comingSoon: true,
  },
];

export default function ThemeScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboarding();
  const [selected, setSelected] = useState(draft.theme || "light");

  function handleNext() {
    updateDraft({ theme: selected });
    router.push("/onboarding/google");
  }

  return (
    <OnboardingStepShell
      stepKey="theme"
      eyebrow="Look & feel"
      title="Make Udhar Kitab yours."
      subtitle="Choose the look you'll enjoy using every day."
      ctaLabel="Continue"
      onPressCta={handleNext}
    >
      <View style={styles.cards}>
        {THEME_OPTIONS.map((opt) => {
          const isSelected = selected === opt.code;
          return (
            <Pressable
              key={opt.code}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => setSelected(opt.code)}
            >
              <View style={[styles.swatch, { backgroundColor: opt.swatchBg }]}>
                <View
                  style={[styles.swatchBar, { backgroundColor: opt.swatchBar }]}
                />
                <View style={styles.swatchLine1} />
                <View style={styles.swatchLine2} />
              </View>

              <View style={styles.cardText}>
                <View style={styles.labelRow}>
                  <Text
                    style={[styles.label, isSelected && styles.labelSelected]}
                  >
                    {opt.label}
                  </Text>
                  {opt.comingSoon && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sub}>{opt.sub}</Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ApprovalStamp visible={!!selected} label="Style saved" />
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  cards: { gap: theme.spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.spacing.md,
  },
  cardSelected: {
    borderColor: theme.color.primary,
    backgroundColor: theme.color.primarySoft,
  },
  cardPressed: { opacity: 0.88 },

  swatch: {
    width: 56,
    height: 76,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    overflow: "hidden",
    padding: 6,
    gap: 4,
  },
  swatchBar: { height: 10, borderRadius: 3, marginBottom: 2 },
  swatchLine1: {
    height: 6,
    borderRadius: 2,
    backgroundColor: theme.color.border,
    width: "80%",
  },
  swatchLine2: {
    height: 6,
    borderRadius: 2,
    backgroundColor: theme.color.border,
    width: "60%",
  },

  cardText: { flex: 1, gap: 3 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 17, fontWeight: "700", color: theme.color.textPrimary },
  labelSelected: { color: theme.color.primaryDeep },
  sub: { fontSize: 12.5, color: theme.color.textSecondary },
  badge: {
    backgroundColor: theme.color.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: theme.color.amber },

  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: theme.color.primary },
  radioInner: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: theme.color.primary,
  },
});
