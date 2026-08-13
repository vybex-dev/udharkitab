/**
 * constants/theme.js
 * Design tokens lifted from the new "Udhar Kitab" onboarding mockups.
 * Extends/complements the existing constants/colors.js — screens can keep
 * importing `colors` for anything not listed here, but onboarding screens
 * should prefer these tokens so the new look stays consistent.
 *
 * NOTE: if your real constants/colors.js already exports some of these
 * names with different values, prefer merging rather than duplicating —
 * e.g. `export const colors = { ...oldColors, ...theme.color }`.
 */

export const theme = {
  color: {
    primary: "#534AB7",        // primary-container in mockups (buttons, CTAs)
    primaryDeep: "#3B309E",    // primary (headers, active text)
    primaryTint: "#E3DFFF",    // primary-fixed (selected card bg)
    primarySoft: "rgba(83,74,183,0.05)", // selected card wash

    background: "#F8F9FA",
    surface: "#F8F9FA",
    surfaceCard: "#FFFFFF",         // surface-container-lowest
    surfaceMuted: "#F3F4F5",        // surface-container-low
    surfaceElevated: "#EDEEEF",     // surface-container

    border: "#C8C4D5",              // outline-variant
    borderStrong: "#787584",        // outline

    textPrimary: "#191C1D",         // on-surface
    textSecondary: "#474553",       // on-surface-variant
    textTertiary: "#78758480",      // faded outline text

    onPrimary: "#FFFFFF",

    success: "#146C2E",
    successLight: "#E3F5E9",
    error: "#BA1A1A",
    errorLight: "#FFDAD6",
    amber: "#8A4900",
    amberLight: "#FFDCC3",

    white: "#FFFFFF",
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // React Native can't load Google Fonts via <link>. If expo-font +
  // @expo-google-fonts/manrope / work-sans / jetbrains-mono are installed
  // and loaded in App.js, swap these family names in. Until then this
  // falls back to system fonts with matching weights, so layout/spacing
  // still matches the mockups even without the exact typeface.
  font: {
    headline: {
      fontFamily: undefined, // e.g. "Manrope_800ExtraBold" once loaded
      fontWeight: "800",
    },
    headlineSemibold: {
      fontFamily: undefined, // "Manrope_700Bold"
      fontWeight: "700",
    },
    body: {
      fontFamily: undefined, // "WorkSans_400Regular"
      fontWeight: "400",
    },
    label: {
      fontFamily: undefined, // "JetBrainsMono_600SemiBold"
      fontWeight: "600",
      letterSpacing: 0.6,
    },
  },

  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    button: {
      shadowColor: "#534AB7",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};
