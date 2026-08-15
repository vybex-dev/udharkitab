/**
 * lib/profile.js
 *
 * Shop name + theme preference, captured during onboarding and editable
 * later from Settings. Same local-first pattern as lib/trial.js:
 *   - local SQLite `app_meta` is read/written for instant, offline-safe
 *     access
 *   - Firebase Firestore `users` document is best-effort synced whenever there's a
 *     connection, keyed by the logged-in user's uid
 */

import { getMeta, setMeta } from "./db";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const META_KEY_SHOP_NAME = "profile_shop_name";
const META_KEY_THEME = "profile_theme";
const META_KEY_ONBOARDING_COMPLETE = "onboarding_complete";
const META_KEY_PRIVACY_ACCEPTED_AT = "privacy_policy_accepted_at";

export const THEMES = ["light"]; // only theme shipped today; more later

// ── Local ─────────────────────────────────────────────────────────────────────

export async function getLocalProfile() {
  const [shopName, theme, onboardingComplete] = await Promise.all([
    getMeta(META_KEY_SHOP_NAME),
    getMeta(META_KEY_THEME),
    getMeta(META_KEY_ONBOARDING_COMPLETE),
  ]);
  return {
    shopName: shopName || "",
    theme: theme || "light",
    onboardingComplete: onboardingComplete === "1",
  };
}

export async function setLocalShopName(shopName) {
  await setMeta(META_KEY_SHOP_NAME, (shopName || "").trim());
}

export async function setLocalTheme(theme) {
  await setMeta(META_KEY_THEME, theme || "light");
}

export async function markOnboardingComplete() {
  await setMeta(META_KEY_ONBOARDING_COMPLETE, "1");
}

export async function isOnboardingComplete() {
  const v = await getMeta(META_KEY_ONBOARDING_COMPLETE);
  return v === "1";
}

/**
 * Records that the person accepted the Privacy Policy checkbox during
 * onboarding — stored as a timestamp (not just "1") so there's a record
 * of *when* consent was given, in case the policy is ever revised.
 */
export async function markPrivacyPolicyAccepted() {
  await setMeta(META_KEY_PRIVACY_ACCEPTED_AT, new Date().toISOString());
}

export async function getPrivacyPolicyAcceptedAt() {
  return getMeta(META_KEY_PRIVACY_ACCEPTED_AT);
}

// ── Cloud sync (best-effort, never blocks the UI) ────────────────────────────

/**
 * Pushes shopName/theme/language/email/displayName to the user's Firestore document.
 */
export async function pushProfileToCloud({ shopName, theme, language, email, displayName } = {}) {
  try {
    const user = auth.currentUser;
    const userId = user?.uid;
    if (!userId) return { success: false, reason: "no-session" };

    const patch = {};
    if (shopName !== undefined) patch.shop_name = shopName;
    if (theme !== undefined) patch.theme = theme;
    if (language !== undefined) patch.language = language;
    if (email !== undefined) patch.email = email;
    if (displayName !== undefined) patch.display_name = displayName;

    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, patch, { merge: true });
    
    return { success: true };
  } catch (e) {
    console.error("pushProfileToCloud error (will stay local-only for now):", e);
    return { success: false, reason: "error", error: e };
  }
}

/**
 * Pulls the cloud profile down and overwrites local storage.
 */
export async function pullProfileFromCloud() {
  try {
    const user = auth.currentUser;
    const userId = user?.uid;
    if (!userId) return { success: false, reason: "no-session" };

    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    
    if (!docSnap.exists()) return { success: true, found: false };

    const row = docSnap.data();
    if (row.shop_name) await setLocalShopName(row.shop_name);
    if (row.theme) await setLocalTheme(row.theme);
    
    return { success: true, found: true, row };
  } catch (e) {
    console.error("pullProfileFromCloud error (offline?):", e);
    return { success: false, reason: "error", error: e };
  }
}

/**
 * Deletes the user's Firestore profile document. Best-effort — used as
 * part of full account deletion (see lib/firebase.js deleteAccount()).
 */
export async function deleteCloudProfile() {
  try {
    const user = auth.currentUser;
    const userId = user?.uid;
    if (!userId) return { success: false, reason: "no-session" };

    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);

    return { success: true };
  } catch (e) {
    // Best-effort — if Firestore rules don't allow deleting the doc (or the
    // device is offline), account deletion still proceeds via deleteAccount()
    // in lib/firebase.js. Use warn, not error, so Expo's LogBox doesn't
    // treat this expected, already-handled case as a hard failure.
    console.warn("deleteCloudProfile: could not delete cloud profile (non-fatal):", e?.message || e);
    return { success: false, reason: "error", error: e };
  }
}
