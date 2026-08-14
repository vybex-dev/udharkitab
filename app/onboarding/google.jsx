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
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";
import GoogleSignInButton from "../../components/GoogleSignInButton";

export default function OnboardingGoogleScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { draft, updateDraft } = useOnboarding();

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
      updateDraft({
        uid: session.user.uid,
        email: session.user.email || "",
        displayName: session.user.displayName || "",
        photoURL: session.user.photoURL || "",
      });
      setSignedIn(true);
      router.push("/onboarding/trial");
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingStepShell
      stepKey="google"
      eyebrow="Secure your khata"
      title="Let's secure your account."
      subtitle="Sign in with Google to continue — it's quick and secure."
      ctaLabel={null}
      onPressCta={null}
      error={error}
    >
      <View style={styles.field}>
        <GoogleSignInButton onPress={handleGoogleSignIn} loading={loading} />
      </View>

      <ApprovalStamp visible={signedIn} label="Signed in" />

      <View style={styles.trustBox}>
        <Text style={styles.trustIcon}>🔒</Text>
        <Text style={styles.trustText}>
          We only use your Google account to create and secure your khata. No OTPs, no passwords.
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
