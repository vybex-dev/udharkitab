/**
 * contexts/OnboardingContext.js
 *
 * Holds answers collected across the onboarding screens in memory (not
 * persisted) until the final step commits them to local storage + Firebase.
 * This keeps each screen simple — they read/write a shared draft instead of
 * each managing their own persistence — and means a user backing out
 * mid-flow (closing the app) just starts over cleanly with nothing
 * half-saved.
 *
 * Ordered step list also lives here so the progress bar and each screen's
 * "next" navigation stay in sync with a single source of truth.
 */

import React, { createContext, useContext, useState, useCallback } from "react";

export const ONBOARDING_STEPS = [
  { key: "language", path: "/onboarding/language" },
  { key: "shop-name", path: "/onboarding/shop-name" },
  { key: "theme", path: "/onboarding/theme" },
  { key: "google", path: "/onboarding/google" },
  { key: "sync", path: "/onboarding/sync" },
  { key: "trial", path: "/onboarding/trial" },
];

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [draft, setDraftState] = useState({
    shopName: "",
    theme: "light",
    uid: "",
    email: "",
    displayName: "",
    photoURL: "",
    privacyAccepted: false,
    syncEnabled: false,
  });

  const updateDraft = useCallback((patch) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = { draft, updateDraft };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  }
  return ctx;
}

export function stepIndex(key) {
  return ONBOARDING_STEPS.findIndex((s) => s.key === key);
}
