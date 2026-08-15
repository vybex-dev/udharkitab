import "react-native-url-polyfill/auto";
/**
 * app/_layout.jsx
 * Root layout with:
 *  - LanguageProvider wrapping everything
 *  - Welcome gate: a brand-new install (onboarding not complete, no
 *    session) lands on /welcome first and explicitly picks "I'm new" vs
 *    "I already have a khata" instead of always being dropped into
 *    onboarding.
 *  - Onboarding gate: users who pick "I'm new" go through /onboarding/*
 *    once (language → shop name → theme → phone → OTP → trial start)
 *  - Auth + plan gate: returning users go auth → trial/plan status → destination
 *  - GestureHandlerRootView + SafeAreaProvider
 *
 * Onboarding vs. legacy language-picker/login:
 *  onboarding_complete (lib/profile.js, local app_meta) is the single flag
 *  that decides whether a user has been through the full onboarding flow.
 *  It's set at the very end of /onboarding/trial once the user taps
 *  "Start free trial" — or automatically, the moment a returning user's
 *  cloud profile is recovered after they sign in from /login (see
 *  handleGoogleSignIn in login.jsx and the recovery step below). Until one
 *  of those happens, any unauthenticated segment routes into /welcome —
 *  the old standalone /language-picker screen still exists (Settings still
 *  links to it for "Change Language"), it's just no longer the first-launch
 *  entry point.
 */

import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator, AppState } from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";

import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { getCombinedPlanStatus } from "../lib/trial";
import { isOnboardingComplete, markOnboardingComplete, pullProfileFromCloud } from "../lib/profile";
import { initDB, closeDB } from "../lib/db";
import { colors } from "../constants/colors";

// Routes reachable without a session. "onboarding" covers the whole
// /onboarding/* group (expo-router gives the group's directory name as
// segments[0] for any route inside it).
const PUBLIC_SEGMENTS = ["welcome", "login", "language-picker", "onboarding"];

export default function RootLayout() {
  return (
    <LanguageProvider>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AppGate />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </LanguageProvider>
  );
}

// ── Top-level gate: wait for language read, then hand off ─────────────────────
function AppGate() {
  const { languageReady } = useLanguage();

  if (!languageReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <AuthGate />;
}

// ── Auth + onboarding + plan gate ──────────────────────────────────────────────
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, user, loading: authLoading } = useAuth();

  const [planStatus, setPlanStatus] = useState(null);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(null); // null = unknown yet

  const rcConfigured = useRef(false);
  const hasCheckedOnce = useRef(false);
  const gateRunning = useRef(false);
  const recoveryAttempted = useRef(false);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  // Init DB early; close it cleanly on unmount so the native handle is
  // released before a potential hot-reload re-opens it (prevents the
  // "shared object already released" crash on Android).
  useEffect(() => {
    (async () => {
      try {
        await initDB();
        const done = await isOnboardingComplete();
        setOnboardingDone(done);
      } catch (e) {
        console.error("Init/onboarding check error:", e);
        setOnboardingDone(false);
      } finally {
        setOnboardingChecked(true);
      }
    })();
    return () => {
      closeDB().catch(() => {});
    };
  }, []);

  const runGate = useCallback(async () => {
    if (authLoading || !onboardingChecked || gateRunning.current) return;
    gateRunning.current = true;

    try {
      const currentSegment = segmentsRef.current[0];

      // ── Step 0: Onboarding (first ever launch, not yet completed) ────────
      if (!onboardingDone) {
        // A session can exist here without onboarding_complete being set
        // locally — e.g. a returning user reinstalled, or the app relaunched
        // with a persisted native session before local state caught up. If
        // so, try to recover their profile from the cloud once, silently,
        // instead of making them sit through onboarding or the welcome
        // screen again.
        if (session && !recoveryAttempted.current) {
          recoveryAttempted.current = true;
          try {
            const result = await pullProfileFromCloud();
            if (result.success && result.found) {
              await markOnboardingComplete();
              setOnboardingDone(true);
              router.replace("/");
              return;
            }
          } catch (e) {
            console.error("Onboarding recovery error:", e);
          }
        }

        if (!PUBLIC_SEGMENTS.includes(currentSegment)) {
          router.replace("/welcome");
        }
        return;
      }

      // ── Step 1: Auth ─────────────────────────────────────────────────────
      if (!session) {
        const inPublic = PUBLIC_SEGMENTS.includes(currentSegment);
        if (!inPublic) router.replace("/login");
        return;
      }

      // ── Step 2: Plan status ────────────────────────────────────────────────
      if (!hasCheckedOnce.current) setCheckingPlan(true);

      const status = await getCombinedPlanStatus();
      setPlanStatus(status);
      hasCheckedOnce.current = true;

      const inPublic = PUBLIC_SEGMENTS.includes(currentSegment);
      if (inPublic) {
        router.replace("/");
      }
    } catch (e) {
      console.error("Gate error:", e);
    } finally {
      setCheckingPlan(false);
      gateRunning.current = false;
    }
  }, [authLoading, onboardingChecked, onboardingDone, session, user]);

  useEffect(() => {
    runGate();
  }, [runGate]);

  useEffect(() => {
    if (!session) {
      rcConfigured.current = false;
      hasCheckedOnce.current = false;
      recoveryAttempted.current = false;
    }
  }, [session]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && session) runGate();
    });
    return () => sub.remove();
  }, [session, runGate]);

  if (authLoading || !onboardingChecked) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="language-picker"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="add-entry"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />

        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="customer/[id]" options={{ headerShown: false }} />
      </Stack>

      {checkingPlan && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
