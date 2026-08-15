/**
 * lib/firebase.js
 * Firebase client + Google Sign-In auth helpers.
 *
 * Auth:      @react-native-firebase/auth + @react-native-google-signin/google-signin
 *            (native — falls back to Mock in Expo Go/Web dev builds)
 * Firestore: firebase JS SDK             (JS — works everywhere)
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider as JsGoogleAuthProvider,
  signInWithCredential as jsSignInWithCredential,
  signOut as jsSignOut,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// ── JS SDK Auth — exists purely so Firestore's `request.auth` is populated ────
// @react-native-firebase/auth (below) is the *native* SDK and is what
// actually drives sign-in/session UX. It does NOT share auth state with the
// JS `firebase/firestore` SDK used for `db` above — those are two unrelated
// clients. Firestore security rules read `request.auth` from this JS SDK's
// context, so without also signing in here, every rule requiring
// `request.auth != null` fails even while the person is validly logged in
// natively. See signInWithGoogle() below, which signs into both.
let jsAuth;
try {
  jsAuth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  // Hot reload / fast refresh can call this twice — initializeAuth throws
  // "already-initialized" on the second call. Fall back to the existing
  // instance instead of crashing.
  jsAuth = getAuth(app);
}

// ── Auth: Native vs Mock Fallback ─────────────────────────────────────────────
let nativeAuthModule = null;
let GoogleSignin = null;
let googleStatusCodes = null;
let isNativeAuthAvailable = false;

try {
  const rnAuth = require("@react-native-firebase/auth");
  nativeAuthModule = rnAuth.default || rnAuth;
  // Test native verification to verify if module is loaded.
  // If native library linking is missing, this throws.
  nativeAuthModule();

  const googleSignInModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleSignInModule.GoogleSignin;
  googleStatusCodes = googleSignInModule.statusCodes;
  GoogleSignin.configure({
    webClientId: Constants.expoConfig.extra.googleWebClientId,
    offlineAccess: false,
  });

  isNativeAuthAvailable = true;
} catch (e) {
  console.warn(
    "⚠️ [Firebase Auth] Native @react-native-firebase/auth / Google Sign-In is not available " +
    "(running in Expo Go, Simulator without dev build, or Web).\n" +
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
  async signInWithGoogle() {
    console.log("🔧 [Mock Auth] Simulating 'Continue with Google' sign-in.");
    mockUser = {
      uid: "mock-google-uid-" + Date.now(),
      displayName: "Dev User",
      email: "dev@udharkitab.test",
      photoURL: null,
    };
    mockListeners.forEach((cb) => cb(mockUser));
    return { user: mockUser };
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
 * Sign in with Google. Returns { session, error }.
 * On native, this opens the Google account picker via
 * @react-native-google-signin/google-signin, exchanges the ID token for a
 * Firebase credential, and signs into @react-native-firebase/auth.
 * In Expo Go / web dev builds it falls back to a mock user so the rest of
 * the app remains testable without a dev client build.
 */
export async function signInWithGoogle() {
  try {
    if (isNativeAuthAvailable) {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      // Newer versions of the SDK nest the payload under `data`.
      const idToken = signInResult?.data?.idToken ?? signInResult?.idToken;
      if (!idToken) {
        throw new Error("Google Sign-In did not return an ID token.");
      }

      const tokens = await GoogleSignin.getTokens();

      // Bridge into the JS SDK FIRST — see the comment above jsAuth.
      // This must happen *before* the native sign-in below, not after:
      // native sign-in fires RNFirebase's own onAuthStateChanged listener
      // the instant it resolves, and the app (see app/_layout.jsx's
      // cloud-profile recovery step) reacts to that session appearing by
      // immediately calling pullProfileFromCloud(). If the JS SDK bridge
      // hadn't finished yet at that point, Firestore's `request.auth` was
      // still null and every read/write failed with "Missing or
      // insufficient permissions" — even though the person had just
      // successfully signed in. Doing the JS SDK sign-in first guarantees
      // Firestore's auth context is ready before anything in the app can
      // react to the native session.
      // Best-effort: if this fails, we still proceed to native sign-in so
      // the person stays logged in — they just won't get cloud sync until
      // the next successful sign-in.
      try {
        const jsCredential = JsGoogleAuthProvider.credential(idToken, tokens.accessToken);
        await jsSignInWithCredential(jsAuth, jsCredential);
      } catch (e) {
        console.warn("signInWithGoogle: JS SDK auth bridge failed (cloud sync will not work until this succeeds):", e?.message || e);
      }

      const googleCredential = nativeAuthModule.GoogleAuthProvider.credential(
        idToken,
        tokens.accessToken
      );
      const userCredential = await nativeAuthModule().signInWithCredential(googleCredential);

      return { session: { user: userCredential.user }, error: null };
    } else {
      const { user } = await mockAuthObj.signInWithGoogle();
      return { session: { user }, error: null };
    }
  } catch (error) {
    // Swallow the "user closed the picker" case as a silent no-op, not an error toast.
    if (googleStatusCodes && error?.code === googleStatusCodes.SIGN_IN_CANCELLED) {
      return { session: null, error: null };
    }
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
 * Permanently deletes the currently signed-in user's Firebase Auth account.
 * If Firebase requires a recent login (auth/requires-recent-login — common
 * when the session is old), it silently re-runs the Google sign-in flow to
 * get a fresh credential and retries once before giving up.
 * Returns { error }. error is null on success.
 */
export async function deleteAccount() {
  try {
    if (isNativeAuthAvailable) {
      const user = nativeAuthModule().currentUser;
      if (!user) return { error: null };

      try {
        await user.delete();
      } catch (err) {
        if (err?.code === "auth/requires-recent-login") {
          // Re-authenticate with a fresh Google credential, then retry once.
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const signInResult = await GoogleSignin.signIn();
          const idToken = signInResult?.data?.idToken ?? signInResult?.idToken;
          const tokens = await GoogleSignin.getTokens();
          const credential = nativeAuthModule.GoogleAuthProvider.credential(
            idToken,
            tokens.accessToken
          );
          await user.reauthenticateWithCredential(credential);
          try {
            const jsCredential = JsGoogleAuthProvider.credential(idToken, tokens.accessToken);
            await jsSignInWithCredential(jsAuth, jsCredential);
          } catch (e) {
            // Non-fatal — see signInWithGoogle() for why this can't block the flow.
          }
          await user.delete();
        } else {
          throw err;
        }
      }

      try {
        await GoogleSignin.revokeAccess();
      } catch (e) {
        // Non-fatal — account is already deleted from Firebase.
      }
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Non-fatal.
      }
      try {
        await jsSignOut(jsAuth);
      } catch (e) {
        // Non-fatal.
      }
    } else {
      await mockAuthObj.signOut();
    }
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  try {
    if (isNativeAuthAvailable) {
      await nativeAuthModule().signOut();
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Non-fatal — Firebase sign-out already succeeded.
      }
    } else {
      await mockAuthObj.signOut();
    }
    try {
      await jsSignOut(jsAuth);
    } catch (e) {
      // Non-fatal — jsAuth may never have signed in successfully.
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

/**
 * Convenience object mirroring `firebase/auth`'s `auth.currentUser` shape,
 * used by lib/profile.js and lib/trial.js for Firestore writes keyed by uid.
 */
export const auth = {
  get currentUser() {
    return isNativeAuthAvailable ? nativeAuthModule().currentUser : mockAuthObj.currentUser;
  },
};
