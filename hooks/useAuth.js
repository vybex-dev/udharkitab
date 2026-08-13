/**
 * hooks/useAuth.js
 * Subscribes to Supabase auth state.
 * Returns { session, user, loading }.
 * Used by _layout.jsx to guard routes.
 */

import { useState, useEffect } from "react";
import { getSession, onAuthChange } from "../lib/firebase";

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Grab the current session immediately
    getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    // 2. Subscribe to future changes (login, logout, token refresh)
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
