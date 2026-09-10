/**
 * app/login.jsx
 * Login — one and only option: "Continue with Google". No phone, no OTP.
 */

import { View, Text, StyleSheet, Image, ScrollView, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { signInWithGoogle, signOut } from "../lib/firebase";
import { pullProfileFromCloud, markOnboardingComplete } from "../lib/profile";
import { getCloudSyncEnabled, restoreCustomersFromCloud } from "../lib/db";
import { useLanguage } from "../contexts/LanguageContext";
import { en } from "../constants/translations/en";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { colors } from "../constants/colors";
import GoogleSignInButton from "../components/GoogleSignInButton";
import NetworkErrorScreen from "../components/NetworkErrorScreen";

export default function LoginScreen() {
  const router = useRouter();
  // This screen is intentionally always shown in English, regardless of the
  // app's selected language (see `en` import above) — only `setLanguage` is
  // still needed here, to apply a returning user's saved language choice
  // once they land back inside the app after signing in.
  const { setLanguage } = useLanguage();
  const { refreshSubscription } = useSubscription();
  const { isConnected, refresh } = useNetworkStatus();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noAccountFound, setNoAccountFound] = useState(false);

  // Was cloud sync on the last time this device knew its state? This screen
  // only shows for *returning* users (a fresh install has no local meta
  // yet, so this stays false and the network gate below never fires for
  // brand-new signups — see app/onboarding/google.jsx for that flow).
  const [syncWasOn, setSyncWasOn] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    getCloudSyncEnabled()
      .then(setSyncWasOn)
      .catch(() => setSyncWasOn(false));
  }, []);

  async function handleRetry() {
    setRetrying(true);
    await refresh();
    setRetrying(false);
  }

  // Only block once we actually know both the sync flag and connectivity —
  // isConnected starts null, so this can't flash on a screen that's really
  // fine.
  const networkBlocked = syncWasOn && isConnected === false;

  if (networkBlocked) {
    return <NetworkErrorScreen onRetry={handleRetry} retrying={retrying} />;
  }

  async function handleGoogleSignIn() {
    setError("");
    setNoAccountFound(false);
    setLoading(true);
    try {
      const { session, error: err } = await signInWithGoogle();
      if (err) throw err;
      if (!session) return; // user closed the account picker — nothing to show

      // This screen is specifically for returning users, so confirm a
      // cloud profile actually exists for this Google account before
      // sending them home — otherwise _layout.jsx's gate would just leave
      // them stuck here with a session but no onboarding_complete flag.
      const result = await pullProfileFromCloud();
      if (result.success && result.found) {
        // Bring their khatas back too — pullProfileFromCloud only restores
        // shop name/theme, this is what actually gets customers/entries/
        // payments back onto the device (no-ops if local data already exists).
        await restoreCustomersFromCloud().catch(() => {});
        // Same gap existed for their chosen language — apply it now that
        // we're back on the language context that owns it.
        if (result.language) await setLanguage(result.language);
        await markOnboardingComplete();
        await refreshSubscription().catch(() => {});
        router.replace("/");
      } else {
        setNoAccountFound(true);
        // Sign back out so they land on a clean slate if they back out of
        // this screen or reopen the app, rather than being half-signed-in.
        await signOut().catch(() => {});
      }
    } catch (e) {
      setError(e.message ?? en.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.brand}>
          <View style={styles.logoShadowWrap}>
            <Image
              source={require("../assets/icon.png")}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>{en.appName}</Text>
          <Text style={styles.tagline}>{en.loginTagline}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{en.loginTitle}</Text>
          <Text style={styles.stepSub}>{en.loginSubtitle}</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {noAccountFound ? (
            <View style={styles.noAccountBox}>
              <Text style={styles.noAccountText}>{en.loginNoAccountFound}</Text>
              <Pressable onPress={() => router.push("/onboarding/language")} hitSlop={6}>
                <Text style={styles.noAccountLink}>{en.loginSetUpInstead}</Text>
              </Pressable>
            </View>
          ) : null}

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={loading}
            label={en.continueWithGoogle}
          />
        </View>

        <Text style={styles.footer}>{en.dataLocal}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20, gap: 20 },

  brand: { alignItems: "center", gap: 8, marginBottom: 8 },
  logoShadowWrap: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: { width: 84, height: 84, borderRadius: 20 },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 15, color: colors.textSecondary },

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  stepSub: { fontSize: 14, color: colors.textSecondary, marginTop: -10 },

  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
  },

  noAccountBox: {
    backgroundColor: colors.amberLight,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  noAccountText: { fontSize: 13, color: colors.amber, fontWeight: "500", lineHeight: 18 },
  noAccountLink: { fontSize: 13, color: colors.primary, fontWeight: "700" },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
