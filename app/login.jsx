/**
 * app/login.jsx
 * Login — one and only option: "Continue with Google". No phone, no OTP.
 */

import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { signInWithGoogle } from "../lib/firebase";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function LoginScreen() {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const { session, error: err } = await signInWithGoogle();
      if (err) throw err;
      // A null session with no error means the user closed the picker —
      // nothing to show. On success, navigation is owned by _layout.jsx's gate.
    } catch (e) {
      setError(e.message ?? t.error);
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
          <Text style={styles.appName}>{t.appName}</Text>
          <Text style={styles.tagline}>{t.loginTagline}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{t.loginTitle}</Text>
          <Text style={styles.stepSub}>{t.loginSubtitle}</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={loading}
            label={t.continueWithGoogle}
          />
        </View>

        <Text style={styles.footer}>{t.dataLocal}</Text>
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

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
