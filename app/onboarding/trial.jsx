/**
 * app/onboarding/trial.jsx
 * Restyled to match the mockup's "90 DAYS FREE" trial card (gift icon,
 * big number, feature checklist) while keeping the ledger-cover reveal
 * card as a bonus above it. Logic unchanged.
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useLanguage } from "../../contexts/LanguageContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";

import { startTrial } from "../../lib/trial";
import {
  setLocalShopName,
  setLocalTheme,
  markOnboardingComplete,
  pushProfileToCloud,
} from "../../lib/profile";

function todayStamp() {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OnboardingTrialScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { draft } = useOnboarding();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FEATURES = [
    t.trialFeature1 ? t.trialFeature1() : "Add and manage customer credit",
    t.trialFeature2 || "Record payments and see outstanding amounts",
    t.trialFeature3 || "Keep your shop's udhaar organized",
  ];

  async function handleStartTrial() {
    setError("");
    setLoading(true);
    try {
      await setLocalShopName(draft.shopName);
      await setLocalTheme(draft.theme);
      await startTrial();

      pushProfileToCloud({
        shopName: draft.shopName,
        theme: draft.theme,
        language,
        email: draft.email,
        displayName: draft.displayName,
      }).catch(() => {});

      await markOnboardingComplete();
      router.replace("/");
    } catch (e) {
      console.error("Onboarding trial start error:", e);
      setError(t.error || "Something went wrong starting your trial. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingStepShell
      stepKey="trial"
      eyebrow={t.trialKhataReadyEyebrow || "Your khata is ready"}
      title={t.trialKhataReadyTitle || "Your digital khata is ready."}
      subtitle={
        t.trialKhataReadySub
          ? t.trialKhataReadySub()
          : "Start tracking your shop's udhaar today — 100% free of cost."
      }
      ctaLabel={
        loading
          ? t.trialOpeningCta || "Opening your khata..."
          : t.trialStartCta
          ? t.trialStartCta()
          : "Open My Ledger"
      }
      onPressCta={handleStartTrial}
      ctaLoading={loading}
      error={error}
      footerExtra={
        <Text style={styles.legalNote}>
          {t.trialLegalNote
            ? t.trialLegalNote()
            : "Udhar Kitab is 100% free of cost. All data stays secure on your device."}
        </Text>
      }
    >
      <View style={styles.trialCard}>
        <View style={styles.trialTop}>
          <View style={styles.giftBadge}>
            <Text style={styles.giftIcon}>🎁</Text>
          </View>
          <Text style={styles.trialNumber}>{t.trialBadgeTitle || "100% FREE"}</Text>
          <Text style={styles.trialCaption}>{t.trialBadgeSubtitle || "No card or payment required"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ledger cover reveal */}
      <View style={styles.coverCard}>
        <Text style={styles.coverBrand}>
          📒 {(t.appName || "UdharKitab").toUpperCase()}
        </Text>
        <Text style={styles.coverShop} numberOfLines={2}>
          {draft.shopName || t.shopNamePlaceholder || "Your Shop"}
        </Text>
        <View style={styles.coverRule} />
        <View style={styles.coverMetaRow}>
          <Text style={styles.coverMetaLabel}>{t.trialCoverOpened || "Opened"}</Text>
          <Text style={styles.coverMetaValue}>{todayStamp()}</Text>
        </View>
        <View style={styles.coverMetaRow}>
          <Text style={styles.coverMetaLabel}>{t.trialCoverLang || "Language"}</Text>
          <Text style={styles.coverMetaValue}>
            {language === "hi" ? "हिंदी" : "English"}
          </Text>
        </View>
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>
            {t.trialCoverReady || "✓ READY TO USE"}
          </Text>
        </View>
      </View>
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  trialCard: {
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  trialTop: { alignItems: "center", gap: 6, marginBottom: theme.spacing.md },
  giftBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.color.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  giftIcon: { fontSize: 30 },
  trialNumber: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.color.primary,
    letterSpacing: -0.5,
  },
  trialCaption: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.color.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: theme.color.surfaceElevated,
    marginBottom: theme.spacing.md,
  },

  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkIcon: { color: theme.color.primary, fontWeight: "800", fontSize: 15, marginTop: 1 },
  featureText: { flex: 1, fontSize: 14.5, color: theme.color.textPrimary, lineHeight: 21 },

  coverCard: {
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 4,
    ...theme.shadow.card,
  },
  coverBrand: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.color.primary,
    letterSpacing: 1.5,
  },
  coverShop: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.color.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  coverRule: {
    height: 2,
    backgroundColor: theme.color.primaryTint,
    borderRadius: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  coverMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  coverMetaLabel: { fontSize: 13, color: theme.color.textSecondary, fontWeight: "500" },
  coverMetaValue: { fontSize: 13, color: theme.color.textPrimary, fontWeight: "700" },
  readyBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: theme.color.successLight,
    borderWidth: 1,
    borderColor: theme.color.success,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.color.success,
    letterSpacing: 0.4,
  },

  legalNote: {
    fontSize: 11,
    color: theme.color.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
