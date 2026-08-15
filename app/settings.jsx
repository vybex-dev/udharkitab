/**
 * app/settings.jsx
 * Settings modal — fully translated via useLanguage().
 * Includes a "Change Language" row that pushes to /language-picker?from=settings.
 */

import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Switch, Linking,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

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
import { LANGUAGES } from "../constants/translations";
import { colors } from "../constants/colors";
import { PRIVACY_POLICY_URL } from "../constants/links";
import DeleteAccountModal from "../components/DeleteAccountModal";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const THEME_LABELS = { light: "Light", dark: "Dark (coming soon)" };



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
      <Text style={[sec.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
      {content}
    </Pressable>
  );
}

const sec = StyleSheet.create({
  container: { gap: 6 },
  title: {
    fontSize: 12, fontWeight: "600", color: colors.textTertiary,
    letterSpacing: 0.5, textTransform: "uppercase", marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 52,
  },
  rowLabel: { fontSize: 15, color: colors.textPrimary, fontWeight: "500" },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [shopName, setShopName] = useState("");
  const [theme, setTheme] = useState("light");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletionStats, setDeletionStats] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

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
      Alert.alert("", "Dark theme is coming soon — we'll switch you automatically once it's ready.");
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.settingsTitle}</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.done}>{t.done}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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
                <Pressable onPress={() => { setDraftName(shopName); setEditingName(true); }} hitSlop={8}>
                  <Text style={styles.editValue}>
                    {shopName || t.shopNamePlaceholder}{"  "}
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
                <Text style={styles.langLabel}>{currentLang?.nativeLabel}</Text>
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              </View>
            }
          />
        </Section>

        {/* Theme */}
        <Section title="Appearance">
          <Row
            label="Theme"
            onPress={() => {
              Alert.alert("Choose theme", "", [
                { text: "Light", onPress: () => handleThemeChange("light") },
                { text: "Dark (coming soon)", onPress: () => handleThemeChange("dark") },
                { text: t.cancel, style: "cancel" },
              ]);
            }}
            right={
              <View style={styles.langRight}>
                <Text style={styles.langLabel}>{THEME_LABELS[theme] || "Light"}</Text>
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              </View>
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
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
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
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            right={<Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>}
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
              loggingOut
                ? <ActivityIndicator size="small" color={colors.danger} />
                : <Text style={{ color: colors.danger, fontSize: 18 }}>›</Text>
            }
          />
          <Row
            label={t.deleteAccount}
            danger
            onPress={openDeleteAccountModal}
            right={<Text style={{ color: colors.danger, fontSize: 18 }}>›</Text>}
          />
        </Section>

        <Text style={styles.bottomNote}>{t.bottomNote}</Text>
      </ScrollView>

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

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  done: { fontSize: 16, fontWeight: "600", color: colors.primary },

  scroll: { padding: 16, gap: 20, paddingBottom: 40 },

  editRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  nameInput: {
    flex: 1, height: 42, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.primary, borderRadius: 10, paddingHorizontal: 12,
    fontSize: 15, color: colors.textPrimary,
  },
  saveNameBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  saveNameText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  editValue: { fontSize: 14, color: colors.textSecondary, fontWeight: "500", maxWidth: 160, textAlign: "right" },
  dataNote: { fontSize: 12, color: colors.textSecondary, maxWidth: 180, textAlign: "right", lineHeight: 16 },
  dataHint: {
    fontSize: 11.5, color: colors.textTertiary, lineHeight: 16,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  versionText: { fontSize: 14, color: colors.textTertiary },

  // Language row right side
  langRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },

  bottomNote: { textAlign: "center", fontSize: 12, color: colors.textTertiary, lineHeight: 18, marginTop: 4 },
});
