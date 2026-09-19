/**
 * app/onboarding/google.jsx
 * Step 4 of onboarding (replaces the old phone.jsx + otp.jsx pair) —
 * one tap, "Continue with Google", creates the real Firebase session.
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { signInWithGoogle } from "../../lib/firebase";
import { useLanguage } from "../../contexts/LanguageContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import { pullProfileFromCloud, markOnboardingComplete } from "../../lib/profile";
import { restoreCustomersFromCloud } from "../../lib/db";

export default function OnboardingGoogleScreen() {
  const router = useRouter();
  const { t, setLanguage } = useLanguage();
  const { draft, updateDraft } = useOnboarding();
  const { refreshSubscription } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const { session, error: err } = await signInWithGoogle();
      if (err) throw err;
      if (!session) {
        // User closed the account picker — just let them try again.
        return;
      }

      // This Google account may already have a khata from before — the
      // person may have tapped "I'm new" by mistake, or be re-onboarding
      // on a new/reset device. Recognize that the same way login.jsx does
      // for the explicit "I already have a khata" flow, instead of
      // barreling into a fresh setup that would silently overwrite their
      // real shop name/theme/language and leave their actual customers
      // behind in the cloud, untouched, while this device shows nothing
      // (or someone else's leftover local data).
      const result = await pullProfileFromCloud();
      if (result.success && result.found) {
        await restoreCustomersFromCloud().catch(() => {});
        if (result.language) await setLanguage(result.language);
        await markOnboardingComplete();
        await refreshSubscription().catch(() => {});
        router.replace("/");
        return;
      }

      updateDraft({
        uid: session.user.uid,
        email: session.user.email || "",
        displayName: session.user.displayName || "",
        photoURL: session.user.photoURL || "",
      });
      setSignedIn(true);
      router.push("/onboarding/sync");
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingStepShell
      stepKey="google"
      eyebrow={t.onboardingGoogleEyebrow}
      title={t.onboardingGoogleTitle}
      subtitle={t.onboardingGoogleSubtitle}
      ctaLabel={null}
      onPressCta={null}
      error={error}
    >
      <View style={styles.field}>
        <GoogleSignInButton onPress={handleGoogleSignIn} loading={loading} />
      </View>

      <ApprovalStamp visible={signedIn} label={t.onboardingGoogleStamp} />

      <View style={styles.trustBox}>
        <Text style={styles.trustIcon}>🔒</Text>
        <Text style={styles.trustText}>
          {t.onboardingGoogleTrust}
        </Text>
      </View>
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.spacing.sm },

  trustBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: theme.color.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.color.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  trustIcon: { fontSize: 16, marginTop: 1 },
  trustText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.color.textSecondary,
  },
});
