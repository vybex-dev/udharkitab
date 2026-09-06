/**
 * app/settings.jsx
 * Settings modal — fully translated via useLanguage().
 * Includes a "Change Language" row that pushes to /language-picker?from=settings.
 */

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "../components/PressableScale";

import { signOut, deleteAccount } from "../lib/firebase";
import {
  getLocalProfile,
  setLocalShopName,
  setLocalTheme,
  pushProfileToCloud,
  deleteCloudProfile,
} from "../lib/profile";
import {
  getAccountDeletionStats,
  wipeAllLocalData,
  getCloudSyncEnabled,
  enableCloudSync,
  disableCloudSync,
} from "../lib/db";
import { deleteAllCloudCustomerData } from "../lib/cloudSync";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { LANGUAGES } from "../constants/translations";
import { colors } from "../constants/colors";
import DeleteAccountModal from "../components/DeleteAccountModal";
import NetworkErrorScreen from "../components/NetworkErrorScreen";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

// THEME_LABELS is built dynamically using translation keys — see getThemeLabel() in the component

// ── Section / Row helpers ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <View style={sec.container}>
      <Text style={sec.title}>{title}</Text>
      <View style={sec.card}>{children}</View>
    </View>
  );
}

function Row({ label, right, onPress, danger = false }) {
  const content = (
    <View style={sec.row}>
      <Text style={[sec.rowLabel, danger && { color: colors.danger }]}>
        {label}
      </Text>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} activeScale={0.985}>
      {content}
    </PressableScale>
  );
}

const sec = StyleSheet.create({
  container: { gap: 8, marginBottom: 8 },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginLeft: 6,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.05)",
    minHeight: 52,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    letterSpacing: -0.2,
    flex: 1,
    lineHeight: 22,
    includeFontPadding: false,
    marginRight: 8,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isPremium, trial, planSource, presentCustomerCenter, restore } =
    useSubscription();

  // Translated theme labels — built here so they always reflect the current language
  const themeLabels = {
    light: t.themeLightLabel,
    dark: t.themeDarkComingSoon || t.themeDarkLabel,
  };

  const [shopName, setShopName] = useState("");
  const [theme, setTheme] = useState("light");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletionStats, setDeletionStats] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Only used to block *turning sync on* while offline — turning it off
  // never needs the network (local flag flip + best-effort cloud delete).
  const { isConnected, refresh } = useNetworkStatus();
  const [networkBlocked, setNetworkBlocked] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getLocalProfile();
      setShopName(profile.shopName);
      setTheme(profile.theme);
      setSyncEnabled(await getCloudSyncEnabled());
    } catch (e) {
      console.error("loadProfile error:", e);
    }
  }

  async function handleSyncToggle(next) {
    if (next && isConnected === false) {
      // Turning sync ON needs the network for the initial push — don't
      // flip the switch, take over the screen instead.
      setNetworkBlocked(true);
      return;
    }
    setSyncBusy(true);
    setSyncEnabled(next); // optimistic — feels instant, we revert on failure
    try {
      if (next) {
        await enableCloudSync();
      } else {
        await disableCloudSync();
      }
    } catch (e) {
      console.error("handleSyncToggle error:", e);
      setSyncEnabled(!next);
      Alert.alert(t.error || "Something went wrong", "");
    } finally {
      setSyncBusy(false);
    }
  }

  async function handleNetworkRetry() {
    setRetrying(true);
    const online = await refresh();
    setRetrying(false);
    if (online) {
      setNetworkBlocked(false);
      handleSyncToggle(true);
    }
  }

  async function handleRestorePurchases() {
    setRestoring(true);
    try {
      const res = await restore();
      if (res.isPremium) {
        Alert.alert(
          t.restoreSuccessTitle || "Purchases Restored",
          t.restoreSuccessMessage ||
            "Your premium subscription has been restored successfully!",
        );
      } else if (res.error) {
        Alert.alert(t.restoreErrorTitle || "Restore Failed", res.error);
      } else {
        Alert.alert(
          t.restoreNoneTitle || "No Purchases Found",
          t.restoreNoneMessage ||
            "We could not find an active subscription associated with your account.",
        );
      }
    } catch (e) {
      Alert.alert(
        t.restoreErrorTitle || "Restore Failed",
        e?.message || "Failed to restore.",
      );
    } finally {
      setRestoring(false);
    }
  }

  async function saveShopName() {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    try {
      await setLocalShopName(trimmed);
      setShopName(trimmed);
      setEditingName(false);
      // Best-effort cloud sync — local is already saved, this just keeps
      // the reinstall-on-new-device case accurate.
      pushProfileToCloud({ shopName: trimmed }).catch(() => {});
    } catch (e) {
      console.error("saveShopName error:", e);
    }
  }

  async function handleThemeChange(nextTheme) {
    if (nextTheme === "dark") {
      Alert.alert(
        "",
        "Dark theme is coming soon — we'll switch you automatically once it's ready.",
      );
      return;
    }
    try {
      await setLocalTheme(nextTheme);
      setTheme(nextTheme);
      pushProfileToCloud({ theme: nextTheme }).catch(() => {});
    } catch (e) {
      console.error("handleThemeChange error:", e);
    }
  }

  async function handleLogout() {
    Alert.alert(t.logoutConfirmTitle, t.logoutConfirmMessage, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logout,
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut();
            router.replace("/login");
          } catch (e) {
            Alert.alert(t.error, t.retry);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  async function openDeleteAccountModal() {
    try {
      const stats = await getAccountDeletionStats();
      setDeletionStats(stats);
    } catch (e) {
      console.error("getAccountDeletionStats error:", e);
      setDeletionStats({ customerCount: 0, totalPending: 0, entryCount: 0 });
    }
    setDeleteModalVisible(true);
  }

  async function handleLogoutInstead() {
    setDeleteModalVisible(false);
    await handleLogout();
  }

  async function handleConfirmDeleteAccount() {
    // Best-effort cloud cleanup first (needs the still-valid session), then
    // the auth account itself, then wipe everything stored on-device.
    await deleteCloudProfile().catch(() => {});
    await deleteAllCloudCustomerData().catch(() => {});
    const { error } = await deleteAccount();
    if (error) throw error;
    await wipeAllLocalData();
    setDeleteModalVisible(false);
    router.replace("/login");
  }

  // Current language display
  const currentLang = LANGUAGES.find((l) => l.code === language);

  if (networkBlocked) {
    return (
      <NetworkErrorScreen onRetry={handleNetworkRetry} retrying={retrying} />
    );
  }

  return (
    <SafeAreaView key={language} style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.settingsTitle}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.done}>{t.done}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Pro Membership Banner */}
          <PressableScale
            style={styles.proBanner}
            onPress={async () => {
              if (!isPremium) {
                router.push("/paywall");
              } else {
                presentCustomerCenter();
              }
            }}
          >
            <View style={styles.proBannerLeft}>
              <View style={styles.proIconBadge}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.proTitleRow}>
                  <Text style={styles.proBannerTitle}>UDHAR KITAB PRO</Text>
                  <View style={styles.proPill}>
                    <Text style={styles.proPillText}>
                      {isPremium
                        ? "ACTIVE"
                        : trial?.active
                          ? `${trial.daysLeft}D TRIAL`
                          : "UPGRADE"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.proBannerSub}>
                  {isPremium
                    ? "Full Pro Membership active"
                    : "Unlimited customers, entries & automated sync"}
                </Text>
              </View>
            </View>
            <Text style={styles.proArrow}>›</Text>
          </PressableScale>

          {/* Shop name */}
          <Section title={t.shopSection}>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder={t.shopNamePlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveShopName}
                  maxLength={40}
                />
                <Pressable onPress={saveShopName} style={styles.saveNameBtn}>
                  <Text style={styles.saveNameText}>{t.saveShop}</Text>
                </Pressable>
              </View>
            ) : (
              <Row
                label={t.shopName}
                right={
                  <Pressable
                    onPress={() => {
                      setDraftName(shopName);
                      setEditingName(true);
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.editValue}>
                      {shopName || t.shopNamePlaceholder}
                      {"  "}
                      <Text style={{ color: colors.primary }}>✎</Text>
                    </Text>
                  </Pressable>
                }
              />
            )}
          </Section>

          {/* Language */}
          <Section title={t.languageSection}>
            <Row
              label={t.changeLanguage}
              onPress={() => router.push("/language-picker?from=settings")}
              right={
                <View style={styles.langRight}>
                  <Text style={styles.langFlag}>{currentLang?.flag}</Text>
                  <Text style={styles.langLabel}>
                    {currentLang?.nativeLabel}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
                </View>
              }
            />
          </Section>

          {/* Theme */}
          <Section title={t.appearanceSection}>
            <Row
              label={t.themeLabel}
              onPress={() => {
                Alert.alert(t.chooseTheme, "", [
                  {
                    text: t.themeLightLabel,
                    onPress: () => handleThemeChange("light"),
                  },
                  {
                    text: t.themeDarkComingSoon || t.themeDarkLabel,
                    onPress: () => handleThemeChange("dark"),
                  },
                  { text: t.cancel, style: "cancel" },
                ]);
              }}
              right={
                <View style={styles.langRight}>
                  <Text style={styles.langLabel}>
                    {themeLabels[theme] || t.themeLightLabel}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
                </View>
              }
            />
          </Section>

          {/* Subscription */}
          <Section title={t.planSection || "Subscription"}>
            <Row
              label={t.planStatus || "Plan Status"}
              right={
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: isPremium
                      ? colors.primary
                      : trial?.active
                        ? colors.textPrimary
                        : colors.danger,
                  }}
                >
                  {isPremium
                    ? t.planPremiumActive || "★ UDHAR KITAB Premium"
                    : trial?.active
                      ? t.planTrialActive
                        ? t.planTrialActive(trial.daysLeft)
                        : `🎁 Free Trial (${trial.daysLeft}d left)`
                      : t.planTrialExpired || "Trial Expired"}
                </Text>
              }
            />
            {!isPremium ? (
              <Row
                label={t.upgradeToPremium || "Upgrade to Premium"}
                onPress={() => router.push("/paywall")}
                right={
                  <View style={styles.langRight}>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {t.viewPlans || "View Plans"}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 18 }}>
                      ›
                    </Text>
                  </View>
                }
              />
            ) : (
              <Row
                label={t.manageSubscription || "Manage Subscription"}
                onPress={() => presentCustomerCenter()}
                right={
                  <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
                }
              />
            )}
            <Row
              label={t.restorePurchases || "Restore Purchases"}
              onPress={handleRestorePurchases}
              right={
                restoring ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {t.restorePurchase || "Restore"}
                  </Text>
                )
              }
            />
          </Section>

          {/* Data */}
          <Section title={t.dataSection}>
            <Row
              label={t.dataWhereLabel}
              right={
                <Text style={styles.dataNote}>
                  {syncEnabled ? t.dataSynced : t.dataLocal}
                </Text>
              }
            />
            <Row
              label={t.cloudSyncLabel}
              right={
                syncBusy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={syncEnabled}
                    onValueChange={handleSyncToggle}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={syncEnabled ? colors.primary : "#FFFFFF"}
                  />
                )
              }
            />
            <Text style={styles.dataHint}>
              {syncEnabled ? t.cloudSyncOnHint : t.cloudSyncOffHint}
            </Text>
            <Row
              label={t.privacyPolicyLabel}
              onPress={() => router.push("/privacy-policy")}
              right={
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              }
            />
          </Section>

          {/* App */}
          <Section title={t.appSection}>
            <Row
              label={t.appVersion}
              right={<Text style={styles.versionText}>{APP_VERSION}</Text>}
            />
          </Section>

          {/* Account / Logout */}
          <Section title={t.accountSection}>
            <Row
              label={t.logout}
              danger
              onPress={handleLogout}
              right={
                loggingOut ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Text style={{ color: colors.danger, fontSize: 18 }}>›</Text>
                )
              }
            />
            <Row
              label={t.deleteAccount}
              danger
              onPress={openDeleteAccountModal}
              right={
                <Text style={{ color: colors.danger, fontSize: 18 }}>›</Text>
              }
            />
          </Section>

          <Text style={styles.bottomNote}>{t.bottomNote}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <DeleteAccountModal
        visible={deleteModalVisible}
        stats={deletionStats}
        onClose={() => setDeleteModalVisible(false)}
        onLogoutInstead={handleLogoutInstead}
        onConfirmDelete={handleConfirmDeleteAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  done: { fontSize: 16, fontWeight: "600", color: colors.primary },

  scroll: { padding: 16, gap: 20, paddingBottom: 40 },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  saveNameBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveNameText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  editValue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    maxWidth: 160,
    textAlign: "right",
  },
  dataNote: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 180,
    textAlign: "right",
    lineHeight: 16,
  },
  dataHint: {
    fontSize: 11.5,
    color: colors.textTertiary,
    lineHeight: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  versionText: { fontSize: 14, color: colors.textTertiary },

  // Language row right side
  langRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  langFlag: { fontSize: 18 },
  langLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    flexShrink: 0,
    lineHeight: 20,
    includeFontPadding: false,
  },

  bottomNote: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
    marginTop: 4,
  },

  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(79, 70, 229, 0.2)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  proBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  proIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  proTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  proBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  proPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.4,
  },
  proBannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  proArrow: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: "700",
    marginLeft: 8,
  },
});
