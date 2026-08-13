/**
 * lib/firebase.js
 * Firebase client + phone OTP auth helpers.
 *
 * Auth:     @react-native-firebase/auth  (native — falls back to Mock in Expo Go/Web)
 * Firestore: firebase JS SDK             (JS — works everywhere)
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import Constants from "expo-constants";

// ── Firestore via JS SDK (still used for DB reads/writes) ─────────────────────
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// ── Auth: Native vs Mock Fallback ─────────────────────────────────────────────
let nativeAuthModule = null;
let isNativeAuthAvailable = false;

try {
  const rnAuth = require("@react-native-firebase/auth");
  nativeAuthModule = rnAuth.default || rnAuth;
  // Test native verification to verify if module is loaded.
  // If native library linking is missing, this throws.
  nativeAuthModule();
  isNativeAuthAvailable = true;
} catch (e) {
  console.warn(
    "⚠️ [Firebase Auth] Native @react-native-firebase/auth is not available (running in Expo Go, Simulator without dev build, or Web).\n" +
    "👉 Falling back to Developer Mock Auth Mode."
  );
}

// Mock auth object for Expo Go / Web
let mockUser = null;
const mockListeners = new Set();

const mockAuthObj = {
  get currentUser() {
    return mockUser;
  },
  async signInWithPhoneNumber(phone) {
    console.log(`🔧 [Mock Auth] Sending OTP to ${phone}. Use any 6-digit OTP (e.g. 123456) to confirm.`);
    return {
      confirm: async (code) => {
        console.log(`🔧 [Mock Auth] Verifying OTP: ${code}`);
        mockUser = {
          uid: "mock-user-uid-" + phone.replace(/\D/g, ""),
          phoneNumber: phone,
          displayName: "Mock User",
        };
        mockListeners.forEach((cb) => cb(mockUser));
        return { user: mockUser };
      },
    };
  },
  async signOut() {
    mockUser = null;
    mockListeners.forEach((cb) => cb(null));
    return Promise.resolve();
  },
  onAuthStateChanged(callback) {
    mockListeners.add(callback);
    callback(mockUser); // Trigger immediately
    return () => {
      mockListeners.delete(callback);
    };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise an Indian phone number to E.164 format (+91XXXXXXXXXX).
 */
export function normalisePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0"))
    return `+91${digits.slice(1)}`;
  return null;
}

/**
 * Send OTP to the given E.164 phone number.
 * Returns { confirmationResult, error }
 */
export async function sendOtp(phone) {
  try {
    if (isNativeAuthAvailable) {
      const confirmationResult = await nativeAuthModule().signInWithPhoneNumber(phone);
      return { confirmationResult, error: null };
    } else {
      const confirmationResult = await mockAuthObj.signInWithPhoneNumber(phone);
      return { confirmationResult, error: null };
    }
  } catch (error) {
    return { confirmationResult: null, error };
  }
}

/**
 * Verify OTP entered by the user.
 * Returns { session, error }.
 */
export async function verifyOtp(confirmationResult, token) {
  if (!confirmationResult) {
    return { session: null, error: new Error("No confirmation result found.") };
  }
  try {
    const result = await confirmationResult.confirm(token);
    return { session: { user: result.user }, error: null };
  } catch (error) {
    return { session: null, error };
  }
}

/**
 * Get the current session (null if not logged in).
 */
export async function getSession() {
  const user = isNativeAuthAvailable ? nativeAuthModule().currentUser : mockAuthObj.currentUser;
  return user ? { user } : null;
}

/**
 * Get the current user (null if not logged in).
 */
export async function getUser() {
  return isNativeAuthAvailable ? nativeAuthModule().currentUser : mockAuthObj.currentUser;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  try {
    if (isNativeAuthAvailable) {
      await nativeAuthModule().signOut();
    } else {
      await mockAuthObj.signOut();
    }
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  const handler = (user) => {
    if (user) {
      callback("SIGNED_IN", { user });
    } else {
      callback("SIGNED_OUT", null);
    }
  };

  if (isNativeAuthAvailable) {
    return nativeAuthModule().onAuthStateChanged(handler);
  } else {
    return mockAuthObj.onAuthStateChanged(handler);
  }
}
