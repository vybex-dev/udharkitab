/**
 * contexts/SubscriptionContext.jsx
 * Context provider and hook for RevenueCat subscriptions in UDHAR KITAB.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import Purchases from "react-native-purchases";
import {
  initRevenueCat,
  isPremiumUser,
  getCustomerInfo,
  getOfferings,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  presentPaywall as rcPresentPaywall,
  presentPaywallIfNeeded as rcPresentPaywallIfNeeded,
  presentCustomerCenter as rcPresentCustomerCenter,
  logInRevenueCat,
  logOutRevenueCat,
  isNativePurchasesAvailable,
  ENTITLEMENT_ID,
} from "../lib/revenuecat";
import { useAuth } from "../hooks/useAuth";
import { getTrialStatus, getCombinedPlanStatus, syncTrialWithCloud } from "../lib/trial";
import NetInfo from "@react-native-community/netinfo";

const SubscriptionContext = createContext({
  isPremium: false,
  isPlanActive: true,
  trial: { started: false, active: true, daysLeft: 90, expiresAt: null },
  planSource: "trial",
  customerInfo: null,
  currentOffering: null,
  packages: {
    monthly: null,
    yearly: null,
    lifetime: null,
  },
  loading: true,
  presentPaywall: async () => ({ success: false }),
  presentPaywallIfNeeded: async () => false,
  presentCustomerCenter: async () => {},
  purchase: async () => ({ success: false }),
  restore: async () => ({ success: false }),
  refreshSubscription: async () => {},
  entitlementId: ENTITLEMENT_ID,
});

export function SubscriptionProvider({ children }) {
  const { session, user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [currentOffering, setCurrentOffering] = useState(null);
  const [trial, setTrial] = useState({ started: false, active: true, daysLeft: 90, expiresAt: null });
  const [planSource, setPlanSource] = useState("trial");
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async (info = null) => {
    try {
      await syncTrialWithCloud().catch(() => {});
      const trialStatus = await getTrialStatus();
      setTrial(trialStatus);
      const activePrem = info ? isPremiumUser(info) : isPremium;
      if (activePrem) {
        setPlanSource("revenuecat");
      } else if (trialStatus.active) {
        setPlanSource("trial");
      } else {
        setPlanSource("expired");
      }
    } catch (e) {
      console.warn("loadStatus error:", e);
    }
  }, [isPremium]);

  // Initialize RevenueCat and attach customer info update listener
  useEffect(() => {
    let isMounted = true;

    async function setup() {
      try {
        await syncTrialWithCloud().catch(() => {});
        await initRevenueCat(user?.uid);
        const info = await getCustomerInfo().catch(() => null);
        const offering = await getOfferings().catch(() => null);
        const trialStatus = await getTrialStatus();

        if (isMounted) {
          const prem = isPremiumUser(info);
          setCustomerInfo(info);
          setIsPremium(prem);
          setCurrentOffering(offering);
          setTrial(trialStatus);
          setPlanSource(prem ? "revenuecat" : trialStatus.active ? "trial" : "expired");
        }
      } catch (err) {
        console.warn("Subscription setup note (offline?):", err?.message || err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    setup();

    const listener = (info) => {
      if (isMounted) {
        const prem = isPremiumUser(info);
        setCustomerInfo(info);
        setIsPremium(prem);
        loadStatus(info);
      }
    };

    let removeListener = () => {};
    if (isNativePurchasesAvailable) {
      Purchases.addCustomerInfoUpdateListener(listener);
      removeListener = () => Purchases.removeCustomerInfoUpdateListener(listener);
    }

    return () => {
      isMounted = false;
      removeListener();
    };
  }, [loadStatus]);

  // Sync RevenueCat identity with Firebase user session
  useEffect(() => {
    let isCancelled = false;

    async function syncUserSession() {
      if (user?.uid) {
        let info = null;
        try {
          info = await logInRevenueCat(user.uid);
        } catch (e) {
          console.warn("RevenueCat logIn error:", e);
        }
        if (isCancelled) return;
        if (info) {
          const prem = isPremiumUser(info);
          setCustomerInfo(info);
          setIsPremium(prem);
        }
        await loadStatus(info);
      } else if (session === null) {
        logOutRevenueCat();
        await loadStatus(null);
      }
    }

    syncUserSession();
    return () => {
      isCancelled = true;
    };
  }, [user?.uid, session, loadStatus]);

  const refreshSubscription = useCallback(async () => {
    try {
      await syncTrialWithCloud().catch(() => {});
      const info = await getCustomerInfo().catch(() => null);
      const offering = await getOfferings().catch(() => null);
      const trialStatus = await getTrialStatus();
      const prem = isPremiumUser(info);
      setCustomerInfo(info);
      setIsPremium(prem);
      setCurrentOffering(offering);
      setTrial(trialStatus);
      setPlanSource(prem ? "revenuecat" : trialStatus.active ? "trial" : "expired");
    } catch (e) {
      console.warn("refreshSubscription note (offline?):", e?.message || e);
    }
  }, []);

  // When connectivity is restored after being offline, quietly retry any
  // pending cloud syncs and refresh RevenueCat status in the background.
  useEffect(() => {
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      if (!wasOffline && !online) {
        wasOffline = true;
      } else if (wasOffline && online) {
        wasOffline = false;
        // Back online — retry pending syncs silently
        refreshSubscription().catch(() => {});
      }
    });
    return unsubscribe;
  }, [refreshSubscription]);

  const purchase = useCallback(async (pkg) => {
    const res = await rcPurchasePackage(pkg);
    if (res.customerInfo) {
      const prem = isPremiumUser(res.customerInfo);
      setCustomerInfo(res.customerInfo);
      setIsPremium(prem);
      setPlanSource(prem ? "revenuecat" : "trial");
    }
    return res;
  }, []);

  const restore = useCallback(async () => {
    const res = await rcRestorePurchases();
    if (res.customerInfo) {
      const prem = isPremiumUser(res.customerInfo);
      setCustomerInfo(res.customerInfo);
      setIsPremium(prem);
      setPlanSource(prem ? "revenuecat" : "trial");
    }
    return res;
  }, []);

  const isPlanActive = isPremium || trial.active;

  const packages = useMemo(() => {
    const available = currentOffering?.availablePackages || [];
    return {
      monthly:
        currentOffering?.monthly ||
        available.find(
          (p) => p.packageType === "MONTHLY" || p.identifier === "$rc_monthly" || p.identifier === "monthly"
        ) ||
        null,
      yearly:
        currentOffering?.annual ||
        available.find(
          (p) => p.packageType === "ANNUAL" || p.identifier === "$rc_annual" || p.identifier === "yearly"
        ) ||
        null,
      lifetime:
        currentOffering?.lifetime ||
        available.find(
          (p) => p.packageType === "LIFETIME" || p.identifier === "$rc_lifetime" || p.identifier === "lifetime"
        ) ||
        null,
    };
  }, [currentOffering]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isPlanActive,
        trial,
        planSource,
        customerInfo,
        currentOffering,
        packages,
        loading,
        presentPaywall: rcPresentPaywall,
        presentPaywallIfNeeded: rcPresentPaywallIfNeeded,
        presentCustomerCenter: rcPresentCustomerCenter,
        purchase,
        restore,
        refreshSubscription,
        entitlementId: ENTITLEMENT_ID,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
