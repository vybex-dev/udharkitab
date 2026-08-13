/**
 * app/onboarding/language.jsx
 * Step 1 of onboarding — language selection.
 * Restyled to match the mockup's language-card rows (avatar circle +
 * label + radio indicator). Logic unchanged from previous version.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useLanguage } from "../../contexts/LanguageContext";
import { LANGUAGES } from "../../constants/translations";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";

export default function OnboardingLanguageScreen() {
  const router = useRouter();
  const { language, chooseLanguage } = useLanguage();
  const [picked, setPicked] = useState(language);
  const [confirming, setConfirming] = useState(false);

  async function handlePick(code) {
    setPicked(code);
  }

  async function handleContinue() {
    setConfirming(true);
    try {
      await chooseLanguage(picked);
      router.push("/onboarding/shop-name");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <OnboardingStepShell
      stepKey="language"
      eyebrow="Welcome"
      title="Your digital khata, made simple."
      subtitle="Track udhaar and payments without the paperwork."
      ctaLabel="Continue"
      onPressCta={handleContinue}
      ctaLoading={confirming}
    >
      <View style={styles.cards}>
        {LANGUAGES.map((lang) => {
          const selected = picked === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handlePick(lang.code)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {(lang.nativeLabel || lang.label || "?").charAt(0)}
                </Text>
              </View>
              <Text
                style={[styles.nativeLabel, selected && styles.labelSelected]}
              >
                {lang.nativeLabel}
              </Text>
              <View
                style={[styles.radioOuter, selected && styles.radioOuterSelected]}
              >
                {selected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ApprovalStamp visible={!!picked} label="Language set" />
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  cards: { width: "100%", gap: theme.spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    minHeight: 72,
    paddingHorizontal: theme.spacing.md,
  },
  cardSelected: {
    borderColor: theme.color.primary,
    backgroundColor: theme.color.primarySoft,
  },
  cardPressed: { opacity: 0.85 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.color.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.color.textPrimary,
  },
  nativeLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: theme.color.textPrimary,
  },
  labelSelected: { color: theme.color.textPrimary, fontWeight: "700" },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: theme.color.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.color.primary,
  },
});
