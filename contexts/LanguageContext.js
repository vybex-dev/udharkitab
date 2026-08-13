/**
 * contexts/LanguageContext.js
 *
 * Provides:
 *   const { t, language, setLanguage, languageReady } = useLanguage();
 *
 * - `t`              → the active translation object (strings map)
 * - `language`       → current language code ("en" | "hi")
 * - `setLanguage(code)` → persist + switch language instantly
 * - `languageReady`  → false only during the initial AsyncStorage read
 *
 * Usage:
 *   import { useLanguage } from "../contexts/LanguageContext";
 *   const { t } = useLanguage();
 *   <Text>{t.addUdhar}</Text>
 *   <Text>{t.otpSentTo(phone)}</Text>   ← function strings
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, DEFAULT_LANGUAGE } from "../constants/translations";

const LANGUAGE_KEY = "udharkitab:language";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [languageReady, setLanguageReady] = useState(false);

  // Load persisted language on mount
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((saved) => {
        if (saved && translations[saved]) {
          setLanguageState(saved);
        }
      })
      .catch(console.error)
      .finally(() => setLanguageReady(true));
  }, []);

  const setLanguage = useCallback(async (code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, code);
    } catch (e) {
      console.error("LanguageContext setLanguage error:", e);
    }
  }, []);

  /**
   * `hasChosen` — true once the user has explicitly picked a language.
   * Used by _layout.jsx to decide whether to show the language-picker screen.
   * We piggyback on whether a value exists in AsyncStorage: if the user never
   * picked, nothing is stored and languageReady will stay on the default.
   */
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((saved) => setHasChosen(!!saved))
      .catch(console.error);
  }, []);

  const chooseLanguage = useCallback(
    async (code) => {
      await setLanguage(code);
      setHasChosen(true);
    },
    [setLanguage],
  );

  const value = {
    language,
    setLanguage,
    chooseLanguage,   // use this on first-launch picker (marks hasChosen)
    t: translations[language],
    languageReady,
    hasChosen,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}
