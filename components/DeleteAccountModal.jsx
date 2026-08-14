/**
 * components/DeleteAccountModal.jsx
 * Full account deletion flow, launched from Settings → Account.
 *
 * Deliberately makes deletion a multi-step decision instead of a single
 * tap, and leads with reasons to stay before ever showing a way out:
 *   1. "plea"    — shows what they stand to lose, offers to keep the account
 *   2. "detour"  — surfaces logout as a reversible alternative
 *   3. "confirm" — final, explicit, type-to-confirm step before anything
 *                  is actually deleted
 *
 * The actual deletion (local SQLite wipe + Firestore doc + Firebase Auth
 * user) is triggered by the parent via onConfirmDelete, so this component
 * stays focused on the UI/flow and doesn't own any data logic itself.
 */

import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator,
} from "react-native";

import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { formatRupees } from "../lib/date";

export default function DeleteAccountModal({
  visible,
  stats,
  onClose,
  onLogoutInstead,
  onConfirmDelete,
}) {
  const { t } = useLanguage();
  const [step, setStep] = useState("plea"); // plea -> detour -> confirm
  const [typedText, setTypedText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmWord = t.deleteConfirmWord;
  const canDelete = typedText.trim().toUpperCase() === confirmWord;

  function reset() {
    setStep("plea");
    setTypedText("");
    setError("");
  }

  function handleClose() {
    if (deleting) return;
    reset();
    onClose();
  }

  async function handleFinalDelete() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await onConfirmDelete();
      // Parent handles navigation away on success; just reset local state.
      reset();
    } catch (e) {
      console.error("DeleteAccountModal delete error:", e);
      setError(t.deleteAccountError);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {step === "plea" && (
          <>
            <Text style={styles.emoji}>🥺</Text>
            <Text style={styles.title}>{t.deletePleaTitle}</Text>
            <Text style={styles.subtitle}>{t.deletePleaSubtitle}</Text>

            <View style={styles.statsBox}>
              <Text style={styles.statsLine}>
                {t.deletePleaStatsCustomers(stats?.customerCount ?? 0)}
              </Text>
              <Text style={styles.statsLine}>
                {t.deletePleaStatsPending(formatRupees(stats?.totalPending ?? 0))}
              </Text>
              <Text style={styles.statsLineWarn}>{t.deletePleaStatsForever}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.keepBtn, pressed && styles.keepBtnPressed]}
              onPress={handleClose}
            >
              <Text style={styles.keepBtnText}>{t.deleteKeepAccount}</Text>
            </Pressable>

            <Pressable onPress={() => setStep("detour")} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>{t.deleteStillWantTo}</Text>
            </Pressable>
          </>
        )}

        {step === "detour" && (
          <>
            <Text style={styles.emoji}>💡</Text>
            <Text style={styles.title}>{t.deleteDetourTitle}</Text>
            <Text style={styles.subtitle}>{t.deleteDetourSubtitle}</Text>

            <Pressable
              style={({ pressed }) => [styles.keepBtn, pressed && styles.keepBtnPressed]}
              onPress={() => {
                reset();
                onLogoutInstead();
              }}
            >
              <Text style={styles.keepBtnText}>{t.deleteLogoutInstead}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.keepBtnOutline, pressed && styles.keepBtnPressed]}
              onPress={handleClose}
            >
              <Text style={styles.keepBtnOutlineText}>{t.deleteKeepAccount}</Text>
            </Pressable>

            <Pressable onPress={() => setStep("confirm")} style={styles.linkBtn}>
              <Text style={styles.linkBtnDanger}>{t.deletePermanently}</Text>
            </Pressable>
          </>
        )}

        {step === "confirm" && (
          <>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>{t.deleteFinalTitle}</Text>
            <Text style={styles.subtitle}>{t.deleteFinalSubtitle}</Text>

            <Text style={styles.typePrompt}>{t.deleteTypePrompt(confirmWord)}</Text>
            <TextInput
              style={styles.typeInput}
              value={typedText}
              onChangeText={(txt) => { setTypedText(txt); setError(""); }}
              placeholder={confirmWord}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleting}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                (pressed || deleting) && { opacity: 0.85 },
                !canDelete && styles.deleteBtnDisabled,
              ]}
              onPress={handleFinalDelete}
              disabled={!canDelete || deleting}
            >
              {deleting
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.deleteBtnText}>{t.deleteConfirmButton}</Text>}
            </Pressable>

            <Pressable onPress={handleClose} style={styles.linkBtn} disabled={deleting}>
              <Text style={styles.linkBtnText}>{t.cancel}</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: "center", marginBottom: 4,
  },
  emoji: { fontSize: 32, textAlign: "center" },
  title: { fontSize: 19, fontWeight: "800", color: colors.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },

  statsBox: {
    backgroundColor: colors.dangerLight, borderRadius: 14, padding: 14, gap: 6, marginTop: 4,
  },
  statsLine: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },
  statsLineWarn: { fontSize: 13, color: colors.danger, fontWeight: "700", marginTop: 2 },

  keepBtn: {
    height: 52, backgroundColor: colors.primary, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginTop: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  keepBtnPressed: { opacity: 0.85 },
  keepBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },

  keepBtnOutline: {
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  keepBtnOutlineText: { color: colors.primary, fontSize: 15, fontWeight: "700" },

  linkBtn: { alignItems: "center", paddingVertical: 10, marginTop: 2 },
  linkBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  linkBtnDanger: { fontSize: 13, color: colors.danger, fontWeight: "600" },

  typePrompt: { fontSize: 13, color: colors.textPrimary, fontWeight: "600", marginTop: 6 },
  typeInput: {
    height: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, fontSize: 16, fontWeight: "700",
    color: colors.textPrimary, letterSpacing: 1,
  },
  errorText: { fontSize: 13, color: colors.danger, fontWeight: "500" },

  deleteBtn: {
    height: 52, backgroundColor: colors.danger, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  deleteBtnDisabled: { opacity: 0.4 },
  deleteBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
