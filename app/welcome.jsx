/**
 * app/welcome.jsx
 * First screen a brand-new install ever sees (before onboarding or login).
 * Asks the one question that decides where they go next:
 *   - "I'm new here"          → /onboarding/language (full onboarding flow)
 *   - "I already have a khata" → /login (Google sign-in for returning users)
 *
 * Purely a routing fork — no data is read or written here. _layout.jsx's
 * gate still owns all the actual redirect logic; this just gives the
 * person an explicit choice instead of always dropping them into
 * onboarding.
 */

import { View, Text, StyleSheet, Image, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

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
          <Text style={styles.tagline}>{t.welcomeTagline}</Text>
        </View>

        {/* Choice card */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{t.welcomeTitle}</Text>
          <Text style={styles.stepSub}>{t.welcomeSubtitle}</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push("/onboarding/language")}
          >
            <Text style={styles.primaryBtnText}>{t.welcomeNewCta}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryBtnText}>{t.welcomeReturningCta}</Text>
          </Pressable>
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
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stepTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  stepSub: { fontSize: 14, color: colors.textSecondary, marginTop: -8, lineHeight: 20 },

  primaryBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },

  secondaryBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: "700" },

  btnPressed: { opacity: 0.85 },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
