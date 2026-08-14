/**
 * components/onboarding/OnboardingStepShell.jsx
 * Restyled to match the "Udhar Kitab" mockups:
 *  - top app bar with back chevron, centered "Udhar Kitab" wordmark,
 *    and a "0X / 06" step counter on the right (was a plain eyebrow line)
 *  - larger, tighter-tracked headline + softer subtitle underneath
 *  - bottom CTA as a tall rounded-16 pill button with a soft shadow,
 *    pinned above a gradient-fade footer like the HTML mockups
 * Logic (props, nav, disabled/loading states) is unchanged.
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

import { theme } from "../../constants/theme";
import { ONBOARDING_STEPS } from "../../contexts/OnboardingContext";

export default function OnboardingStepShell({
  stepKey,
  eyebrow,
  title,
  subtitle,
  children,
  ctaLabel,
  onPressCta,
  ctaDisabled = false,
  ctaLoading = false,
  footerExtra = null,
  error = null,
}) {
  const router = useRouter();
  const stepNum = ONBOARDING_STEPS.findIndex((s) => s.key === stepKey) + 1;
  const total = ONBOARDING_STEPS.length;

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Top app bar */}
      <View style={styles.appBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.wordmark}>Udhar Kitab</Text>
        <Text style={styles.stepCounter}>
          {String(stepNum).padStart(2, "0")}
          <Text style={styles.stepCounterMuted}> / {String(total).padStart(2, "0")}</Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.content}>{children}</View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {ctaLabel ? (
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.ctaPressed,
              (ctaDisabled || ctaLoading) && styles.ctaDisabled,
            ]}
            onPress={onPressCta}
            disabled={ctaDisabled || ctaLoading}
          >
            {ctaLoading ? (
              <ActivityIndicator color={theme.color.onPrimary} />
            ) : (
              <Text style={styles.ctaText}>{ctaLabel}</Text>
            )}
          </Pressable>
        ) : null}
        {footerExtra}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: theme.color.background },

  appBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.color.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  backIcon: { fontSize: 26, color: theme.color.primaryDeep, fontWeight: "600" },
  wordmark: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.color.primaryDeep,
    letterSpacing: -0.2,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.color.textPrimary,
    letterSpacing: 0.5,
    minWidth: 40,
    textAlign: "right",
  },
  stepCounterMuted: { color: theme.color.textSecondary, opacity: 0.5 },

  scroll: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.xl,
  },

  header: { gap: theme.spacing.sm },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.color.primary,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.color.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: theme.color.textSecondary,
    lineHeight: 24,
  },

  content: { flex: 1, gap: theme.spacing.md },

  errorText: {
    fontSize: 13,
    color: theme.color.error,
    fontWeight: "500",
  },

  footer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.color.background,
  },
  cta: {
    height: 56,
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.button,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  ctaText: {
    color: theme.color.onPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
});
