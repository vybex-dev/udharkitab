/**
 * constants/translations/index.js
 * Exports all translation maps and the LANGUAGES config array.
 */
import { en } from "./en";
import { hi } from "./hi";

export const translations = { en, hi };

export const LANGUAGES = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिंदी",
    flag: "🇮🇳",
  },
];

export const DEFAULT_LANGUAGE = "hi";
