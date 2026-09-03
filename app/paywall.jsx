/**
 * app/paywall.jsx
 * Paywall screen for Udhar Kitab Pro.
 * Displayed modally from Settings or as a mandatory blocking gate
 * when a user's 90-day free trial has expired without an active subscription.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useLanguage } from "../contexts/LanguageContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { signOut } from "../lib/firebase";
import { theme } from "../constants/theme";
import { colors } from "../constants/colors";

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    isPremium,
    isPlanActive,
    packages,
    presentPaywall,
    purchase,
    restore,
    refreshSubscription,
  } = useSubscription();

  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Features list
  const FEATURES = [
    t.planFeature1 || "Unlimited customers",
    t.planFeature2 || "Unlimited entries",
    t.planFeature3 || "Data stays only on your phone",
    t.planFeature4 || "Always free updates",
  ];

  async function handleSubscribe() {
    setBusy(true);
    try {
      // 1. Try RevenueCat native paywall UI first
      const res = await presentPaywall();
      if (res.success) {
        await refreshSubscription();
        if (router.canGoBack()) router.back();
        return;
      }

      // 2. If native paywall was not presented (e.g. dev build fallback), try package purchase
      if (packages?.monthly) {
        const pRes = await purchase(packages.monthly);
        if (pRes.success) {
          await refreshSubscription();
          if (router.canGoBack()) router.back();
          return;
        } else if (pRes.error && !pRes.cancelled) {
          Alert.alert(t.error || "Error", pRes.error);
        }
      } else {
        Alert.alert(
          t.paywallBrand || "Udhar Kitab Pro",
          res.result === "NOT_PRESENTED"
            ? "In-app purchases are available on native iOS/Android builds. Please configure store credentials or restore past purchases."
            : t.error || "Unable to load purchase options right now. Please try again."
        );
      }
    } catch (e) {
      console.error("Paywall subscribe error:", e);
      Alert.alert(t.error || "Error", e.message || "Failed to process purchase.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const res = await restore();
      if (res.isPremium) {
        await refreshSubscription();
        Alert.alert(
          t.restoreSuccessTitle || "Purchases Restored",
          t.restoreSuccessMessage || "Your premium subscription has been restored successfully!",
          [
            {
              text: t.done || "Done",
              onPress: () => {
                if (router.canGoBack()) router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t.restoreNoneTitle || "No Purchases Found",
          t.restoreNoneMessage || "We could not find an active subscription associated with your account."
        );
      }
    } catch (e) {
      console.error("Paywall restore error:", e);
      Alert.alert(t.restoreErrorTitle || "Restore Failed", e.message || "Could not restore purchases.");
    } finally {
      setRestoring(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      t.logoutConfirmTitle || "Log Out?",
      t.logoutConfirmMessage || "Are you sure you want to log out?",
      [
        { text: t.cancel || "Cancel", style: "cancel" },
        {
          text: t.logout || "Log Out",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
              router.replace("/welcome");
            } catch (e) {
              console.error("Logout error:", e);
              Alert.alert(t.error || "Error", e.message || "Failed to log out.");
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  }

  // Only users whose plan is already active (who arrived here from Settings) can dismiss
  const canDismiss = isPlanActive;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Top Header / Dismiss Bar */}
      <View style={styles.topBar}>
        {canDismiss ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={theme.color.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.topBarTitle}>
          {t.paywallBrand || "Udhar Kitab Pro"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Crown / Lock Hero Badge */}
        <View style={styles.heroBadge}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={isPlanActive ? "sparkles" : "lock-closed"}
              size={36}
              color={theme.color.primary}
            />
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isPlanActive
              ? t.paywallSubtitle || "Keep tracking your udhar — subscribe now"
              : t.trialExpired || "Your free trial has ended"}
          </Text>
          <Text style={styles.subtitle}>
            {isPlanActive
              ? "Upgrade to Pro for unlimited customers, entries, and continuous updates."
              : t.freeTrialEndedSub ||
                "Subscribe to keep using Udhar Kitab. Your data is safe and will remain accessible once subscribed."}
          </Text>
        </View>

        {/* Pricing Highlight Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeText}>
              {t.cancelAnytime || "Cancel anytime"}
            </Text>
          </View>
          <Text style={styles.priceAmount}>
            {packages?.monthly?.product?.priceString || t.planPrice || "₹149/month"}
          </Text>
          <Text style={styles.priceSub}>
            100% full access to all features
          </Text>
        </View>

        {/* Features Checklist */}
        <View style={styles.featuresCard}>
          {FEATURES.map((item, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleSubscribe}
            disabled={busy || restoring}
            style={({ pressed }) => [
              styles.subscribeBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              (busy || restoring) && { opacity: 0.7 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.subscribeBtnText}>
                {t.subscribe || "Subscribe — ₹149/month"}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleRestore}
            disabled={busy || restoring}
            style={({ pressed }) => [
              styles.restoreBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            {restoring ? (
              <ActivityIndicator color={theme.color.primary} size="small" />
            ) : (
              <Text style={styles.restoreBtnText}>
                {t.restorePurchase || "Restore purchase"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Legal Disclaimer */}
        <Text style={styles.legalText}>
          {t.legal ||
            "Subscribing will charge your Apple/Google account. The subscription renews automatically until you cancel."}
        </Text>

        {/* Sign Out Option (so user is never trapped) */}
        <View style={styles.logoutWrapper}>
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.6 }]}
          >
            {loggingOut ? (
              <ActivityIndicator color={colors.textSecondary} size="small" />
            ) : (
              <Text style={styles.logoutText}>
                {t.logout || "Log Out"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.color.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.color.textPrimary,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroBadge: {
    alignItems: "center",
    marginVertical: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.color.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.color.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14.5,
    color: theme.color.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  pricingCard: {
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.color.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
    ...theme.shadow.card,
  },
  pricingBadge: {
    backgroundColor: theme.color.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    marginBottom: 10,
  },
  pricingBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: theme.color.primaryDeep,
    textTransform: "uppercase",
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.color.textPrimary,
    letterSpacing: -0.5,
  },
  priceSub: {
    fontSize: 13,
    color: theme.color.textSecondary,
    marginTop: 4,
  },
  featuresCard: {
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: 20,
    gap: 14,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.color.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: theme.color.textPrimary,
    flex: 1,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  subscribeBtn: {
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.button,
  },
  subscribeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  restoreBtn: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreBtnText: {
    color: theme.color.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  legalText: {
    fontSize: 11.5,
    color: theme.color.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  logoutWrapper: {
    alignItems: "center",
    marginTop: 8,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontSize: 13.5,
    color: theme.color.textSecondary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
