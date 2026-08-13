/**
 * app/language-picker.jsx
 *
 * Full-screen language selection shown once on first app open.
 * After the user picks, `chooseLanguage()` saves their choice and
 * _layout.jsx's gate routes them to /login.
 *
 * Also reachable from Settings → "Change Language" for returning users.
 * In that case, the `from=settings` query param is present so we show
 * a back button instead of a "continue" CTA.
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useLanguage } from "../contexts/LanguageContext";
import { LANGUAGES } from "../constants/translations";
import { colors } from "../constants/colors";

export default function LanguagePickerScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const fromSettings = from === "settings";

  const { language, chooseLanguage, setLanguage, t } = useLanguage();

  async function handleSelect(code) {
    if (fromSettings) {
      // Just switch — don't mark "first time chosen" again
      await setLanguage(code);
      router.back();
    } else {
      // First launch — mark as chosen, gate will push to /login
      await chooseLanguage(code);
      router.replace("/login");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo */}
        <Text style={styles.logo}>📒</Text>
        <Text style={styles.appName}>UdharKitab</Text>

        {/* Heading — bilingual so it's clear before any selection */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Choose your language</Text>
          <Text style={styles.headingHi}>अपनी भाषा चुनें</Text>
        </View>

        {/* Language cards */}
        <View style={styles.cards}>
          {LANGUAGES.map((lang) => {
            const selected = language === lang.code;
            return (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  styles.card,
                  selected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleSelect(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.cardText}>
                  <Text
                    style={[styles.nativeLabel, selected && styles.labelSelected]}
                  >
                    {lang.nativeLabel}
                  </Text>
                  <Text style={styles.subLabel}>{lang.label}</Text>
                </View>
                {selected && (
                  <View style={styles.checkWrap}>
                    <Text style={styles.check}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Back button when launched from settings */}
        {fromSettings && (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← {t.back}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 0,
  },

  // Logo
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
    marginBottom: 36,
  },

  // Heading
  headingBlock: {
    alignItems: "center",
    marginBottom: 28,
    gap: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headingHi: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Cards
  cards: {
    width: "100%",
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  flag: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  nativeLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  labelSelected: {
    color: colors.primary,
  },
  subLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },

  // Back (settings mode)
  backBtn: {
    marginTop: 36,
  },
  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
});
