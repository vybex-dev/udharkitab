/**
 * app/onboarding/otp.jsx
 * Step 5 of onboarding — OTP verification. On success this creates a real
 * Firebase session, same as login.jsx's step-2.
 *
 * Restyled to show 6 individual boxes like the mockup instead of one
 * merged text field — done by overlaying a single invisible TextInput
 * (still driving all the real state/logic) on top of 6 display boxes, so
 * native keyboard/autofill/paste behavior keeps working exactly as
 * before.
 */

import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";

import { sendOtp, verifyOtp } from "../../lib/firebase";
import { useLanguage } from "../../contexts/LanguageContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";

const OTP_LENGTH = 6;
const RESEND_SECS = 30;

export default function OnboardingOtpScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { draft, updateDraft } = useOnboarding();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECS);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, []);

  function startCountdown() {
    setCountdown(RESEND_SECS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleVerify() {
    setError("");
    if (otp.length < OTP_LENGTH) {
      setError(t.invalidOtp(OTP_LENGTH));
      return;
    }
    setLoading(true);
    try {
      const { session, error: err } = await verifyOtp(draft.confirmationResult, otp);
      if (err) throw err;
      if (!session) throw new Error(t.sessionNotFound);
      router.push("/onboarding/trial");
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError("");
    setOtp("");
    setLoading(true);
    try {
      const { confirmationResult, error: err } = await sendOtp(draft.e164);
      if (err) throw err;
      updateDraft({ confirmationResult });
      startCountdown();
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  const isComplete = otp.length === OTP_LENGTH;

  return (
    <OnboardingStepShell
      stepKey="otp"
      eyebrow="Almost there"
      title={t.enterOtpTitle || "Check your messages."}
      subtitle={t.otpSentTo ? t.otpSentTo(draft.phone) : `Enter the 6-digit code sent to +91 ${draft.phone}.`}
      ctaLabel={t.verifyOtp || "Verify & Continue"}
      onPressCta={handleVerify}
      ctaDisabled={!isComplete}
      ctaLoading={loading}
      error={error}
      footerExtra={
        <Pressable
          onPress={handleResend}
          disabled={countdown > 0 || loading}
          style={styles.resendBtn}
        >
          <Text
            style={[styles.resendText, countdown > 0 && styles.resendDisabled]}
          >
            {countdown > 0
              ? `${t.resendOtp || "Resend code in"} 00:${String(countdown).padStart(2, "0")}`
              : t.resendOtp || "Resend OTP"}
          </Text>
        </Pressable>
      }
    >
      <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const filled = i < otp.length;
          const isCursor = focused && i === otp.length;
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                filled && styles.otpBoxFilled,
                isCursor && styles.otpBoxCursor,
              ]}
            >
              <Text style={styles.otpDigit}>{otp[i] || ""}</Text>
            </View>
          );
        })}
      </Pressable>

      {/* Invisible driver input — keeps existing state/logic identical */}
      <TextInput
        ref={inputRef}
        value={otp}
        onChangeText={(txt) => {
          setOtp(txt.replace(/\D/g, "").slice(0, OTP_LENGTH));
          setError("");
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleVerify}
        autoFocus
        style={styles.hiddenInput}
      />

      <ApprovalStamp visible={isComplete} label="Code entered" />
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.color.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  otpBoxFilled: {
    borderWidth: 2,
    borderColor: theme.color.primaryTint,
  },
  otpBoxCursor: {
    borderWidth: 2,
    borderColor: theme.color.primary,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 1,
    color: theme.color.textPrimary,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },

  resendBtn: { alignItems: "center", paddingVertical: 4 },
  resendText: { fontSize: 14, color: theme.color.textSecondary, fontWeight: "600" },
  resendDisabled: { color: theme.color.textSecondary, opacity: 0.6 },
});
