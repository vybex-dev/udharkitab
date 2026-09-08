/**
 * lib/revenuecat.js
 * Centralized RevenueCat service layer for UDHAR KITAB.
 * Handles configuration, entitlement checking, purchases, paywalls, and Customer Center.
 * Includes graceful fallback when running in Expo Go or before a native development rebuild.
 */

import { NativeModules, Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

// ── Entitlement & API Key ─────────────────────────────────────────────────────
export const ENTITLEMENT_ID = "udhar_kitab_premium";

// Provided RevenueCat test API key
export const REVENUECAT_API_KEY = "goog_jNnVAtyNYrWRuJqevaaTAAHKKsy";

// Check if native RevenueCat module is linked in the running app binary
export const isNativePurchasesAvailable = !!(
  NativeModules &&
  (NativeModules.RNPurchases || NativeModules.Purchases)
);

let isConfigured = false;

/**
 * Initialize RevenueCat SDK.
 * Call this once when the app starts or when the user session becomes available.
 */
export async function initRevenueCat(userId = null) {
  if (isConfigured) return;

  if (!isNativePurchasesAvailable) {
    console.warn(
      "⚠️ [RevenueCat] Native Purchases module is not available in this build.\n" +
        "👉 If you just installed react-native-purchases, rebuild your app binary with: 'npx expo run:android' or 'npx expo run:ios'.\n" +
        "👉 Operating in safe fallback mode (free trial continues normally).",
    );
    return;
  }

  try {
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.WARN);
    }

    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    isConfigured = true;
    console.log("✅ RevenueCat configured successfully.");
  } catch (error) {
    console.warn(
      "⚠️ Failed to initialize RevenueCat (non-fatal):",
      error?.message || error,
    );
  }
}

function isNetworkError(error) {
  if (!error) return false;
  if (error.code === PURCHASES_ERROR_CODE.NETWORK_ERROR) return true;
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("offline") ||
    msg.includes("unable to resolve host") ||
    msg.includes("no address associated with hostname") ||
    msg.includes("error performing request")
  );
}

/**
 * Returns true if the user has an active `udhar_kitab_premium` entitlement.
 */
export function isPremiumUser(customerInfo) {
  if (!customerInfo || !customerInfo.entitlements) return false;
  const entitlement = customerInfo.entitlements.active?.[ENTITLEMENT_ID];
  return entitlement !== undefined && entitlement.isActive;
}

/**
 * Fetch latest customer info from RevenueCat.
 */
export async function getCustomerInfo() {
  if (!isNativePurchasesAvailable || !isConfigured) {
    return {
      entitlements: { active: {}, all: {} },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
    };
  }
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn(
        "RevenueCat getCustomerInfo note: network unavailable, using local cache.",
      );
    } else {
      console.warn("Error fetching CustomerInfo:", error?.message || error);
    }
    return {
      entitlements: { active: {}, all: {} },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
    };
  }
}

/**
 * Fetch available offerings and products configured in RevenueCat dashboard.
 */
export async function getOfferings() {
  if (!isNativePurchasesAvailable || !isConfigured) {
    return null;
  }
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
    return null;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn(
        "RevenueCat getOfferings note: network unavailable (offline).",
      );
    } else {
      console.warn("Error fetching offerings:", error?.message || error);
    }
    return null;
  }
}

/**
 * Purchase a selected RevenueCat package (e.g. Monthly, Yearly, Lifetime).
 */
export async function purchasePackage(packageToBuy) {
  if (!isNativePurchasesAvailable || !isConfigured) {
    return {
      success: false,
      cancelled: false,
      error:
        "Native in-app purchases are not available in this build. Please run via development build ('npx expo run:android' or 'npx expo run:ios').",
    };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    const hasPremium = isPremiumUser(customerInfo);
    return { success: true, isPremium: hasPremium, customerInfo };
  } catch (error) {
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, cancelled: true, error: null };
    }
    console.error("Purchase error:", error);
    return {
      success: false,
      cancelled: false,
      error: error.message || "Purchase failed. Please try again.",
    };
  }
}

/**
 * Restore past purchases across devices or after reinstallation.
 */
export async function restorePurchases() {
  if (!isNativePurchasesAvailable || !isConfigured) {
    return {
      success: false,
      isPremium: false,
      error: "Native in-app purchases are not available in this build.",
    };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasPremium = isPremiumUser(customerInfo);
    return { success: true, isPremium: hasPremium, customerInfo };
  } catch (error) {
    console.error("Restore purchases error:", error);
    return {
      success: false,
      isPremium: false,
      error: error.message || "Failed to restore purchases.",
    };
  }
}

/**
 * Log in a user (e.g. after Firebase authentication).
 * Associates customer info with their specific Firebase user ID.
 */
export async function logInRevenueCat(userId) {
  if (!userId || !isNativePurchasesAvailable || !isConfigured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn("RevenueCat login skipped: network unavailable.");
    } else {
      console.warn(
        "RevenueCat login error (non-fatal):",
        error?.message || error,
      );
    }
    return null;
  }
}

/**
 * Log out user on sign out to revert to an anonymous RevenueCat ID.
 */
export async function logOutRevenueCat() {
  if (!isNativePurchasesAvailable || !isConfigured) return;
  try {
    const isAnonymous = await Purchases.isAnonymous();
    if (!isAnonymous) {
      await Purchases.logOut();
    }
  } catch (error) {
    console.warn(
      "RevenueCat logout error (non-fatal):",
      error?.message || error,
    );
  }
}

// ── Paywalls & Customer Center (react-native-purchases-ui) ───────────────────

/**
 * Present the RevenueCat native paywall modally.
 * Returns { success: boolean, cancelled?: boolean, result: PAYWALL_RESULT }
 */
export async function presentPaywall(offering = null) {
  if (!isNativePurchasesAvailable) {
    console.warn("⚠️ RevenueCat Paywalls require a native dev build.");
    return { success: false, result: PAYWALL_RESULT.NOT_PRESENTED };
  }
  try {
    const options = offering ? { offering } : undefined;
    const result = await RevenueCatUI.presentPaywall(options);

    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return { success: true, result };
      case PAYWALL_RESULT.CANCELLED:
        return { success: false, result, cancelled: true };
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      default:
        return { success: false, result };
    }
  } catch (error) {
    console.error("Error presenting paywall:", error);
    return { success: false, error };
  }
}

/**
 * Present paywall only if the user does NOT have the 'udhar_kitab_premium' entitlement.
 * Returns true if access is unlocked (either already had it, or just purchased/restored).
 */
export async function presentPaywallIfNeeded() {
  if (!isNativePurchasesAvailable) return false;
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
    return (
      result === PAYWALL_RESULT.NOT_PRESENTED ||
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    );
  } catch (error) {
    console.error("Error in presentPaywallIfNeeded:", error);
    return false;
  }
}

/**
 * Present RevenueCat Customer Center for subscription management,
 * feedback, refund requests, and cancellation flow.
 */
export async function presentCustomerCenter() {
  if (!isNativePurchasesAvailable) {
    console.warn("⚠️ Customer Center requires a native dev build.");
    return;
  }
  try {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo }) => {
          console.log("Customer center restore completed:", customerInfo);
        },
        onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
          console.log(
            "Customer feedback survey completed:",
            feedbackSurveyOptionId,
          );
        },
      },
    });
  } catch (error) {
    console.error("Error presenting Customer Center:", error);
  }
}
