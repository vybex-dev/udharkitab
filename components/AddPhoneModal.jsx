/**
 * components/AddPhoneModal.jsx
 * Bottom-sheet shown when the shopkeeper taps "Call" on a customer who has
 * no phone number saved yet. On save it just persists the number — the
 * parent screen decides what (if anything) happens next.
 */

import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from "react-native";

import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function AddPhoneModal({ visible, customerName, onClose, onSave }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleClose() {
    if (saving) return;
    setDigits("");
    setError("");
    onClose();
  }

  async function handleSave() {
    if (digits.length !== 10) {
      setError(t.invalidPhone);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave(`+91${digits}`);
      setDigits("");
    } catch (e) {
      console.error("AddPhoneModal save error:", e);
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{t.addPhoneTitle}</Text>
          <Text style={styles.subtitle}>{t.addPhoneSubtitle(customerName || "")}</Text>

          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={digits}
              onChangeText={(txt) => {
                setDigits(txt.replace(/\D/g, "").slice(0, 10));
                setError("");
              }}
              placeholder="XXXXXXXXXX"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              saving && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.saveBtnText}>{t.save}</Text>}
          </Pressable>

          <Pressable onPress={handleClose} style={styles.cancelBtn} disabled={saving}>
            <Text style={styles.cancelText}>{t.cancel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 14,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: "center", marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 18 },

  phoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  countryCode: {
    height: 52, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    justifyContent: "center",
  },
  countryCodeText: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  phoneInput: {
    flex: 1, height: 52, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 18, fontWeight: "700",
    color: colors.textPrimary, letterSpacing: 2,
  },

  errorText: { fontSize: 13, color: colors.danger, fontWeight: "500" },

  saveBtn: {
    height: 52, backgroundColor: colors.primary, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },

  cancelBtn: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
});
