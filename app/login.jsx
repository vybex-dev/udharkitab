/**
 * app/login.jsx
 * 2-step phone OTP login — fully translated via useLanguage().
 */

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { sendOtp, verifyOtp, normalisePhone } from "../lib/firebase";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

const OTP_LENGTH = 6;
const RESEND_SECS = 30;

export default function LoginScreen() {
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const otpRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
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

  async function handleSendOtp() {
    setError("");
    const normalised = normalisePhone(phone);
    if (!normalised) {
      setError(t.invalidPhone);
      return;
    }
    setE164(normalised);
    setLoading(true);
    try {
      const { confirmationResult: result, error: err } = await sendOtp(normalised);
      if (err) throw err;
      setConfirmationResult(result);
      setStep(2);
      startCountdown();
      setTimeout(() => otpRef.current?.focus(), 400);
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    if (otp.length < OTP_LENGTH) {
      setError(t.invalidOtp(OTP_LENGTH));
      return;
    }
    setLoading(true);
    try {
      const { session, error: err } = await verifyOtp(confirmationResult, otp);
      if (err) throw err;
      if (!session) throw new Error(t.sessionNotFound);
      // Navigation owned by _layout.jsx gate
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
      const { confirmationResult: result, error: err } = await sendOtp(e164);
      if (err) throw err;
      setConfirmationResult(result);
      startCountdown();
    } catch (e) {
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
            {step === 1 ? (
              <>
                <Text style={styles.stepTitle}>{t.enterMobileTitle}</Text>
                <Text style={styles.stepSub}>{t.otpWillBeSent}</Text>

                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={(txt) => {
                      setPhone(txt.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="XXXXXXXXXX"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                    autoFocus
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                    loading && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t.sendOtp}</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>{t.enterOtpTitle}</Text>
                <Text style={styles.stepSub}>{t.otpSentTo(phone)}</Text>

                <Pressable
                  onPress={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                  }}
                  style={styles.changeBtn}
                >
                  <Text style={styles.changeBtnText}>{t.changeNumber}</Text>
                </Pressable>

                <TextInput
                  ref={otpRef}
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={(txt) => {
                    setOtp(txt.replace(/\D/g, "").slice(0, OTP_LENGTH));
                    setError("");
                  }}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                  textAlign="center"
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                    loading && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t.verifyOtp}</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleResend}
                  disabled={countdown > 0 || loading}
                  style={styles.resendBtn}
                >
                  <Text
                    style={[
                      styles.resendText,
                      countdown > 0 && styles.resendDisabled,
                    ]}
                  >
                    {countdown > 0
                      ? `${t.resendOtp} (${countdown}s)`
                      : t.resendOtp}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <Text style={styles.footer}>{t.dataLocal}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
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
  stepSub: { fontSize: 14, color: colors.textSecondary, marginTop: -6 },

  phoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  countryCode: {
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 2,
  },

  otpInput: {
    height: 64,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 12,
  },

  changeBtn: { alignSelf: "flex-start", marginTop: -6 },
  changeBtnText: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
    marginTop: -4,
  },

  primaryBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: "700" },

  resendBtn: { alignItems: "center", marginTop: -4 },
  resendText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  resendDisabled: { color: colors.textTertiary },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
