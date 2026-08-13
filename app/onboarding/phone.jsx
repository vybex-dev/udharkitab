/**
 * app/onboarding/phone.jsx
 * Step 4 of onboarding — phone number entry + send OTP.
 * Restyled to match the mockup: single merged input with flag + "+91"
 * prefix, and a bordered trust-message card below it. Logic unchanged.
 */

import { View, Text, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { sendOtp, normalisePhone } from "../../lib/firebase";
import { useLanguage } from "../../contexts/LanguageContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";

export default function OnboardingPhoneScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { draft, updateDraft } = useOnboarding();

  const [phone, setPhone] = useState(draft.phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp() {
    setError("");
    const normalised = normalisePhone(phone);
    if (!normalised) {
      setError(t.invalidPhone);
      return;
    }
    setLoading(true);
    try {
      const { confirmationResult, error: err } = await sendOtp(normalised);
      if (err) throw err;
      updateDraft({ phone, e164: normalised, confirmationResult });
      router.push("/onboarding/otp");
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  const isValid = phone.length === 10;

  return (
    <OnboardingStepShell
      stepKey="phone"
      eyebrow="Secure your khata"
      title="Let's secure your account."
      subtitle="Enter your mobile number to continue."
      ctaLabel={t.sendOtp || "Send OTP"}
      onPressCta={handleSendOtp}
      ctaDisabled={!isValid}
      ctaLoading={loading}
      error={error}
    >
      <View style={styles.field}>
        <Text style={styles.label}>PHONE NUMBER</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={(txt) => {
              setPhone(txt.replace(/\D/g, "").slice(0, 10));
              setError("");
            }}
            placeholder="98765 43210"
            placeholderTextColor={theme.color.textSecondary}
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleSendOtp}
            autoFocus
          />
        </View>
      </View>

      <ApprovalStamp visible={isValid} label="Number looks good" />

      <View style={styles.trustBox}>
        <Text style={styles.trustIcon}>🔒</Text>
        <Text style={styles.trustText}>
          We'll send a one-time password to verify your number.
        </Text>
      </View>
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.spacing.sm },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.color.textSecondary,
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.color.surfaceCard,
    borderBottomWidth: 2,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 56,
    paddingHorizontal: theme.spacing.md,
    borderRightWidth: 1,
    borderRightColor: theme.color.border,
  },
  flag: { fontSize: 18 },
  countryCodeText: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.color.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: theme.spacing.md,
    fontSize: 20,
    fontWeight: "700",
    color: theme.color.textPrimary,
    letterSpacing: 1,
  },

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
