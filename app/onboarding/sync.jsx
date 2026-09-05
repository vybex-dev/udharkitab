/**
 * app/onboarding/sync.jsx
 * Step 5 of onboarding — privacy consent + cloud sync opt-in.
 * Shown right after Google sign-in, before the trial screen.
 *
 * Two checkboxes:
 *  - Privacy policy acceptance (required to continue).
 *  - Cloud sync opt-in (optional). If the person turns this on, their
 *    customers/entries/payments start mirroring to their private Firestore
 *    space (see lib/cloudSync.js + the sync hooks in lib/db.js) as soon as
 *    the trial starts. Off by default — local-only stays the default,
 *    consent-first behavior.
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useLanguage } from "../../contexts/LanguageContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import OnboardingCheckboxRow from "../../components/onboarding/OnboardingCheckboxRow";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";

export default function OnboardingSyncScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { draft, updateDraft } = useOnboarding();

  const [privacyAccepted, setPrivacyAccepted] = useState(!!draft.privacyAccepted);
  const [syncEnabled, setSyncEnabled] = useState(!!draft.syncEnabled);
  const [error, setError] = useState("");

  function handleNext() {
    if (!privacyAccepted) {
      setError(t.onboardingSyncPrivacyRequired);
      return;
    }
    setError("");
    updateDraft({ privacyAccepted, syncEnabled });
    router.push("/onboarding/trial");
  }

  return (
    <OnboardingStepShell
      stepKey="sync"
      eyebrow={t.onboardingSyncEyebrow}
      title={t.onboardingSyncTitle}
      subtitle={t.onboardingSyncSubtitle}
      ctaLabel={t.continueCta}
      onPressCta={handleNext}
      ctaDisabled={!privacyAccepted}
      error={error}
    >
      <OnboardingCheckboxRow
        checked={privacyAccepted}
        onToggle={() => {
          setPrivacyAccepted((v) => !v);
          setError("");
        }}
        required
        requiredLabel={t.onboardingSyncRequiredBadge}
        title={t.onboardingSyncPrivacyTitle}
        description={t.onboardingSyncPrivacyDescription}
      >
        <Pressable
          hitSlop={8}
          onPress={() => router.push("/privacy-policy")}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>{t.onboardingSyncPrivacyLink}</Text>
        </Pressable>
      </OnboardingCheckboxRow>

      <OnboardingCheckboxRow
        checked={syncEnabled}
        onToggle={() => setSyncEnabled((v) => !v)}
        title={t.onboardingSyncCloudTitle}
        description={t.onboardingSyncCloudDescription}
      />

      <View style={styles.noteBox}>
        <Text style={styles.noteIcon}>ℹ️</Text>
        <Text style={styles.noteText}>{t.onboardingSyncNote}</Text>
      </View>

      <ApprovalStamp visible={privacyAccepted} label={t.onboardingSyncStamp} />
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  linkBtn: { marginTop: 6, alignSelf: "flex-start" },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.color.primary,
    textDecorationLine: "underline",
  },

  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: theme.color.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.color.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  noteIcon: { fontSize: 16, marginTop: 1 },
  noteText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.color.textSecondary,
  },
});
