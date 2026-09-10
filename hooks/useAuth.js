/**
 * hooks/useAuth.js
 * Subscribes to Firebase auth state.
 * Returns { session, user, loading }.
 * Used by _layout.jsx to guard routes.
 */

import { useState, useEffect } from "react";
import { onAuthChange } from "../lib/firebase";

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't end `loading` from an immediate, synchronous currentUser read —
    // on a cold start, native Firebase Auth can take a brief moment to
    // restore a persisted session from disk, and reading .currentUser
    // before that finishes can return null even though a valid session is
    // about to load. That race is what was sending returning users back to
    // /login on every app restart, even though their session was still
    // valid. onAuthStateChanged is guaranteed to fire exactly once with the
    // real, fully-restored state, so that's the only thing allowed to end
    // `loading` here.
    const unsubscribe = onAuthChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    isLoggedIn: !!session,
  };
}
