/**
 * lib/trial.js
 *
 * Tracks the 90-day, no-card-required free trial that starts the moment a
 * user finishes onboarding and taps "Start free trial".
 *
 * Two stores, one source of truth:
 *   - Firebase Firestore `users.trial_started_at`  → the source of truth.
 *   - Local SQLite `app_meta` (key "trial_started_at") → the offline mirror.
 * Real icon for search remove shadow from + in footer
 */

import { getMeta, setMeta } from "./db";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";

async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected !== false;
  } catch {
    return true;
  }
}

export const TRIAL_LENGTH_DAYS = 90;

const META_KEY_TRIAL_STARTED_AT = "trial_started_at";
const META_KEY_TRIAL_PENDING_SYNC = "trial_pending_sync";

// ── Local read/write ─────────────────────────────────────────────────────────

export async function getLocalTrialStartedAt() {
  return getMeta(META_KEY_TRIAL_STARTED_AT);
}

async function setLocalTrialStartedAt(isoString) {
  await setMeta(META_KEY_TRIAL_STARTED_AT, isoString);
}

export function computeTrialStatus(trialStartedAtISO) {
  if (!trialStartedAtISO) {
    return { started: false, active: false, daysLeft: 0, expiresAt: null };
  }
  const startedAt = new Date(trialStartedAtISO);
  const expiresAt = new Date(
    startedAt.getTime() + TRIAL_LENGTH_DAYS * 86400000,
  );
  const msLeft = expiresAt.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  return {
    started: true,
    active: msLeft > 0,
    daysLeft,
    expiresAt,
  };
}

export async function getTrialStatus() {
  let localISO = await getLocalTrialStartedAt();
  if (!localISO) {
    try {
      const user = auth.currentUser;
      const userId = user?.uid;
      if (userId) {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data()?.trial_started_at) {
          localISO = docSnap.data().trial_started_at;
          await setLocalTrialStartedAt(localISO);
        }
      }
    } catch (e) {
      console.warn("getTrialStatus cloud fallback check:", e);
    }
  }
  return computeTrialStatus(localISO);
}

// ── Starting the trial ───────────────────────────────────────────────────────

export async function startTrial() {
  const existing = await getLocalTrialStartedAt();
  if (existing) {
    await pushTrialToCloud(existing);
    return computeTrialStatus(existing);
  }

  try {
    const user = auth.currentUser;
    const userId = user?.uid;
    if (userId) {
      const userDocRef = doc(db, "users", userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data()?.trial_started_at) {
        const cloudISO = docSnap.data().trial_started_at;
        await setLocalTrialStartedAt(cloudISO);
        return computeTrialStatus(cloudISO);
      }
    }
  } catch (e) {
    console.warn("startTrial cloud check warning:", e);
  }

  const nowISO = new Date().toISOString();
  await setLocalTrialStartedAt(nowISO);
  await pushTrialToCloud(nowISO);
  return computeTrialStatus(nowISO);
}

async function pushTrialToCloud(localISO) {
  try {
    const user = auth.currentUser;
    const userId = user?.uid;
    if (!userId) {
      await setMeta(META_KEY_TRIAL_PENDING_SYNC, "1");
      return { success: false, reason: "no-session" };
    }

    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data().trial_started_at) {
      // Cloud already has a start date — it wins.
      await setLocalTrialStartedAt(docSnap.data().trial_started_at);
      await setMeta(META_KEY_TRIAL_PENDING_SYNC, "");
      return { success: true, reconciled: true };
    }

    await setDoc(userDocRef, { trial_started_at: localISO }, { merge: true });

    await setMeta(META_KEY_TRIAL_PENDING_SYNC, "");
    return { success: true, reconciled: false };
  } catch (e) {
    console.warn(
      "pushTrialToCloud note (will retry when online):",
      e?.message || e,
    );
    await setMeta(META_KEY_TRIAL_PENDING_SYNC, "1");
    return { success: false, reason: "error", error: e };
  }
}

// ── Combined plan status (trial + RevenueCat) ────────────────────────────────

export async function getCombinedPlanStatus() {
  try {
    const { getCustomerInfo, isPremiumUser } = require("./revenuecat");
    const customerInfo = await getCustomerInfo().catch(() => null);

    if (customerInfo && isPremiumUser(customerInfo)) {
      return {
        active: true,
        isTrial: false,
        isPremium: true,
        everSubscribed: true,
        expiresAt: null,
        daysLeft: 9999,
        offline: false,
        planSource: "revenuecat",
      };
    }
  } catch (e) {
    console.warn(
      "getCombinedPlanStatus RevenueCat check note:",
      e?.message || e,
    );
  }

  // Check trial status
  try {
    const trial = await getTrialStatus();
    if (trial.started) {
      return {
        active: trial.active,
        isTrial: true,
        isPremium: false,
        everSubscribed: false,
        expiresAt: trial.expiresAt,
        daysLeft: trial.daysLeft,
        offline: false,
        planSource: trial.active ? "trial" : "expired",
      };
    }
  } catch (e) {
    console.warn("getCombinedPlanStatus trial check note:", e?.message || e);
  }

  return {
    active: false,
    isTrial: false,
    isPremium: false,
    everSubscribed: false,
    expiresAt: null,
    daysLeft: 0,
    offline: false,
    planSource: "expired",
  };
}

// ── Reconciliation ───────────────────────────────────────────────────────────

export async function syncTrialWithCloud() {
  try {
    // Skip network calls when offline — local SQLite is the source of truth,
    // and the pending-sync flag will trigger a retry once connectivity returns.
    if (!(await isOnline())) {
      return { synced: false, reason: "offline" };
    }

    const user = auth.currentUser;
    const userId = user?.uid;
    if (!userId) return { synced: false, reason: "no-session" };

    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    const cloudValue = docSnap.exists()
      ? docSnap.data().trial_started_at
      : null;
    const localValue = await getLocalTrialStartedAt();

    if (cloudValue) {
      if (cloudValue !== localValue) {
        await setLocalTrialStartedAt(cloudValue);
      }
      await setMeta(META_KEY_TRIAL_PENDING_SYNC, "");
      return { synced: true, source: "cloud", trialStartedAt: cloudValue };
    }

    if (localValue) {
      await pushTrialToCloud(localValue);
      return {
        synced: true,
        source: "local-pushed",
        trialStartedAt: localValue,
      };
    }

    const onboardingComplete = (await getMeta("onboarding_complete")) === "1";
    if (onboardingComplete) {
      const nowISO = new Date().toISOString();
      await setLocalTrialStartedAt(nowISO);
      await pushTrialToCloud(nowISO);
      return { synced: true, source: "new-trial", trialStartedAt: nowISO };
    }

    return { synced: true, source: "none" };
  } catch (e) {
    console.warn("syncTrialWithCloud note (offline?):", e?.message || e);
    return { synced: false, reason: "error", error: e };
  }
}
