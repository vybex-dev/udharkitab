/**
 * app/add-entry.jsx
 *
 * New fields:
 *  - Contact number (optional → required when adding a duplicate-named customer)
 *  - Expected return date (optional)
 *
 * Duplicate name logic:
 *  When NameDropdown signals `duplicateMode = true` (user tapped "Add another Harsh"),
 *  the phone field gets a red required border and save is blocked until filled.
 */

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import NameDropdown from "../components/NameDropdown";
import {
  insertCustomer,
  insertEntry,
  getCustomerByPhone,
  getCustomerCreditBalance,
  applyCreditToEntry,
} from "../lib/db";
import {
  todayISO,
  formatDate,
  isoToDate,
  dateToISO,
  formatRupees,
} from "../lib/date";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

// ── Date wheel (shared by entry date + due date) ──────────────────────────────
function DatePicker({ value, onChange, allowFuture = false }) {
  const { language } = useLanguage();
  const d = isoToDate(value);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  const MONTHS_HI = [
    "जन",
    "फ़र",
    "मार",
    "अप्र",
    "मई",
    "जून",
    "जुल",
    "अग",
    "सित",
    "अक्त",
    "नव",
    "दिस",
  ];
  const MONTHS_EN = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const MONTHS = language === "hi" ? MONTHS_HI : MONTHS_EN;

  function shift(field, delta) {
    const nd = new Date(year, month, day);
    if (field === "day") nd.setDate(nd.getDate() + delta);
    if (field === "month") nd.setMonth(nd.getMonth() + delta);
    if (field === "year") nd.setFullYear(nd.getFullYear() + delta);
    // entry date: can't be future; due date: can be future, can't be past
    if (!allowFuture && nd > new Date()) return;
    if (allowFuture && nd < new Date(new Date().setHours(0, 0, 0, 0))) return;
    onChange(dateToISO(nd));
  }

  function Spinner({ field, label }) {
    return (
      <View style={dp.spinner}>
        <Pressable onPress={() => shift(field, 1)} hitSlop={8}>
          <Text style={dp.arrow}>▲</Text>
        </Pressable>
        <Text style={dp.value}>{label}</Text>
        <Pressable onPress={() => shift(field, -1)} hitSlop={8}>
          <Text style={dp.arrow}>▼</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={dp.row}>
      <Spinner field="day" label={String(day).padStart(2, "0")} />
      <Text style={dp.sep}>/</Text>
      <Spinner field="month" label={MONTHS[month]} />
      <Text style={dp.sep}>/</Text>
      <Spinner field="year" label={String(year)} />
    </View>
  );
}

const dp = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  spinner: { alignItems: "center", gap: 4, minWidth: 44 },
  arrow: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 38,
    textAlign: "center",
  },
  sep: { fontSize: 18, color: colors.textTertiary, marginBottom: 2 },
});

// ── Tomorrow's ISO date (default due date) ────────────────────────────────────
function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateToISO(d);
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddEntryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [duplicateMode, setDuplicateMode] = useState(false); // phone required

  const [phone, setPhone] = useState("");
  const [selectedPhone, setSelectedPhone] = useState(""); // phone as it was when the customer was selected
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const date = todayISO(); // entry date is always today — not user-editable

  const [dueDateEnabled, setDueDateEnabled] = useState(false);
  const [dueDate, setDueDate] = useState(tomorrowISO());

  const [saving, setSaving] = useState(false);

  // Phone field highlight ref for scroll-to on validation error
  const phoneInputRef = useRef(null);

  function handleDuplicateNew(isDuplicate) {
    setDuplicateMode(isDuplicate);
  }

  // Called by NameDropdown with (id, phone) on selection, or (null) on any
  // name edit / reset.
  function handleSelectCustomer(id, customerPhone) {
    setCustomerId(id);
    if (id) {
      const p = customerPhone
        ? customerPhone.replace(/\D/g, "").slice(-10)
        : "";
      setPhone(p);
      setSelectedPhone(p);
    } else {
      // Name was edited — the old phone no longer belongs to this entry.
      setPhone("");
      setSelectedPhone("");
    }
  }

  // Phone edited manually while a customer is still selected and the name
  // hasn't changed → this is a different person with the same name, so
  // don't overwrite the matched customer's phone. Unlink and let save()
  // create a fresh customer record instead.
  function handlePhoneChange(text) {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (customerId && digits !== selectedPhone) {
      setCustomerId(null);
      setSelectedPhone("");
      setDuplicateMode(true); // reuse existing "will save as a new customer" UI
    }
  }

  async function handleSave() {
    const trimName = customerName.trim();
    const trimPhone = phone.replace(/\D/g, "");
    const parsedAmt = parseFloat(amount.replace(/,/g, ""));

    if (!trimName) {
      Alert.alert("", t.nameRequired);
      return;
    }
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      Alert.alert("", t.invalidAmount);
      return;
    }
    // Any phone number that's been started must be a full 10 digits —
    // don't silently drop a partial one.
    if (trimPhone.length > 0 && trimPhone.length < 10) {
      Alert.alert(
        "",
        t.invalidPhoneNumber ||
          "Please enter a valid 10-digit phone number, or leave it blank.",
      );
      return;
    }
    // Phone is required when creating a second customer with same name
    if (duplicateMode && trimPhone.length === 0) {
      Alert.alert("", t.phoneRequiredForDuplicate);
      return;
    }

    setSaving(true);
    try {
      let cid = customerId;

      if (!cid) {
        const fullPhone =
          trimPhone.length >= 10 ? `+91${trimPhone.slice(-10)}` : null;

        // Don't let the same phone number end up on two different customers
        if (fullPhone) {
          const existing = await getCustomerByPhone(fullPhone);
          if (existing) {
            if (existing.name.trim().toLowerCase() === trimName.toLowerCase()) {
              // Same name + same number = this is that customer — reuse it
              // instead of creating a duplicate row.
              cid = existing.id;
            } else {
              setSaving(false);
              Alert.alert(
                "",
                t.phoneAlreadyUsedBy
                  ? t.phoneAlreadyUsedBy(existing.name)
                  : `This number is already saved for ${existing.name}. Please use a different number, or search for ${existing.name} above and select them instead.`,
              );
              return;
            }
          }
        }

        if (!cid) {
          cid = await insertCustomer({ name: trimName, phone: fullPhone });
        }
      }

      const entryId = await insertEntry({
        customerId: cid,
        amount: parsedAmt,
        note: note.trim() || null,
        date,
        dueDate: dueDateEnabled ? dueDate : null,
      });

      // If this customer already has an advance/credit balance sitting on
      // their khata (from a past overpayment), offer to use it against
      // this new udhar instead of leaving both a debt and a credit open —
      // but always ask first, never apply it silently.
      const creditBalance = await getCustomerCreditBalance(cid);
      if (creditBalance > 0.009) {
        const applyAmount = Math.min(creditBalance, parsedAmt);
        Alert.alert(
          t.applyCreditTitle,
          t.applyCreditMessage(formatRupees(applyAmount), trimName),
          [
            { text: t.applyCreditNo, style: "cancel", onPress: () => router.back() },
            {
              text: t.applyCreditYes,
              onPress: async () => {
                try {
                  await applyCreditToEntry({
                    customerId: cid,
                    entryId,
                    amount: applyAmount,
                  });
                } catch (e) {
                  console.error("applyCreditToEntry error:", e);
                } finally {
                  router.back();
                }
              },
            },
          ],
        );
        return;
      }

      router.back();
    } catch (e) {
      console.error("AddEntry save error:", e);
      Alert.alert(t.error, t.retry);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancel}>{t.cancel}</Text>
          </Pressable>
          <Text style={styles.title}>{t.addEntryTitle}</Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Customer Name ── */}
          <View style={styles.field}>
            <Text style={styles.label}>{t.customerName}</Text>
            <NameDropdown
              value={customerName}
              onChange={setCustomerName}
              onSelectCustomer={handleSelectCustomer}
              onDuplicateNew={handleDuplicateNew}
            />
          </View>

          {/* ── Contact Number ── */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t.contactNumber}</Text>
              {duplicateMode ? (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>{t.required}</Text>
                </View>
              ) : (
                <Text style={styles.optionalTag}>{t.optional}</Text>
              )}
            </View>

            {duplicateMode && (
              <View style={styles.duplicateNotice}>
                <Text style={styles.duplicateNoticeText}>
                  ⚠️ {t.duplicateNameNotice(customerName.trim())}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.phoneRow,
                duplicateMode && !phone && styles.phoneRowRequired,
              ]}
            >
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                ref={phoneInputRef}
                style={styles.phoneInput}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="XXXXXXXXXX"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* ── Amount ── */}
          <View style={styles.field}>
            <Text style={styles.label}>{t.amount}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                returnKeyType="next"
                maxLength={8}
              />
            </View>
          </View>

          {/* ── Note ── */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t.note}</Text>
              <Text style={styles.optionalTag}>{t.optional}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder={t.notePlaceholder}
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              maxLength={120}
            />
          </View>

          {/* ── Expected Return Date ── */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t.expectedReturnDate}</Text>
              <Pressable
                style={[styles.toggleBtn, dueDateEnabled && styles.toggleBtnOn]}
                onPress={() => setDueDateEnabled((v) => !v)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    dueDateEnabled && styles.toggleBtnTextOn,
                  ]}
                >
                  {dueDateEnabled ? t.dueDateOn : t.dueDateOff}
                </Text>
              </Pressable>
            </View>

            {dueDateEnabled && (
              <View style={styles.dateCard}>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  allowFuture={true}
                />
                <Text style={styles.datePreview}>
                  {formatDate(dueDate, language)}
                </Text>
              </View>
            )}

            {!dueDateEnabled && (
              <Text style={styles.dueDateHint}>{t.expectedReturnDateHint}</Text>
            )}
          </View>

          {/* ── Entry Date (always today — not editable) ── */}
          <View style={styles.field}>
            <Text style={styles.label}>{t.date}</Text>
            <View style={styles.dateFixedCard}>
              <Text style={styles.dateFixedText}>
                {formatDate(date, language)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Save */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              saving && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t.saveEntry}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  title: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  cancel: { fontSize: 15, color: colors.primary, fontWeight: "500" },

  scroll: { flex: 1 },
  form: { padding: 16, gap: 20, paddingBottom: 12 },

  field: { gap: 6 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: 2,
  },
  optionalTag: { fontSize: 11, color: colors.textTertiary, fontWeight: "500" },

  requiredBadge: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredBadgeText: { fontSize: 11, fontWeight: "700", color: colors.danger },

  // Duplicate notice
  duplicateNotice: {
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 10,
    padding: 10,
  },
  duplicateNoticeText: {
    fontSize: 13,
    color: colors.amber,
    fontWeight: "600",
    lineHeight: 18,
  },

  // Phone row
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phoneRowRequired: {
    // subtle pulse — just a border tint on the inputs below
  },
  countryCode: {
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: 1,
  },

  input: {
    height: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  noteInput: { height: 52 },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 52,
    paddingLeft: 14,
  },
  rupeeSymbol: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.danger,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: colors.danger,
    height: 52,
  },

  dateCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  datePreview: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  dateFixedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  dateFixedText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  // Due date toggle
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  toggleBtnOn: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  toggleBtnTextOn: { color: colors.primary },
  dueDateHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 2,
    fontStyle: "italic",
  },

  footer: { padding: 16, paddingBottom: 8, backgroundColor: colors.background },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});
