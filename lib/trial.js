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

export const TRIAL_LENGTH_DAYS = 1;

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
  return { started: true, active: true, daysLeft: 9999, expiresAt: null };
}

// ── Starting the trial ───────────────────────────────────────────────────────

export async function startTrial() {
  const existing = await getLocalTrialStartedAt();
  if (existing) {
    await pushTrialToCloud(existing);
    return computeTrialStatus(existing);
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
    console.error("pushTrialToCloud error (will retry later):", e);
    await setMeta(META_KEY_TRIAL_PENDING_SYNC, "1");
    return { success: false, reason: "error", error: e };
  }
}

// ── Combined plan status (trial + RevenueCat) ────────────────────────────────

export async function getCombinedPlanStatus() {
  return {
    active: true,
    isTrial: false,
    everSubscribed: false,
    expiresAt: null,
    daysLeft: 9999,
    offline: false,
    planSource: "free",
  };
}

// ── Reconciliation ───────────────────────────────────────────────────────────

export async function syncTrialWithCloud() {
  try {
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
      return { synced: true, source: "cloud" };
    }

    if (localValue) {
      await pushTrialToCloud(localValue);
      return { synced: true, source: "local-pushed" };
    }

    return { synced: true, source: "none" };
  } catch (e) {
    console.error("syncTrialWithCloud error (offline?):", e);
    return { synced: false, reason: "error", error: e };
  }
}
