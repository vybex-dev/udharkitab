/**
 * app/customer/[id].jsx
 * Customer detail — adds overdue banner with inline date update.
 */

import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useCallback, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getLocalProfile } from "../../lib/profile";

import EntryRow from "../../components/EntryRow";
import AvatarCircle from "../../components/AvatarCircle";
import AddPhoneModal from "../../components/AddPhoneModal";

import {
  getCustomer,
  getEntriesForCustomer,
  getPendingAmountForCustomer,
  settleEntry,
  settleAllEntries,
  getOverdueEntries,
  updateOverdueDates,
  recordPayment,
  getCustomerCreditBalance,
  updateCustomerPhone,
  deleteCustomer,
} from "../../lib/db";
import { dialNumber } from "../../lib/contact";
import {
  bucketEntries,
  buildCombinedMessage,
  openWhatsAppChat,
} from "../../lib/whatsappTemplates";
import {
  formatRupees,
  dateToISO,
  isoToDate,
  formatDateHindi,
  todayISO,
  relativeLabel,
} from "../../lib/date";
import { useLanguage } from "../../contexts/LanguageContext";
import { colors } from "../../constants/colors";

// ── Split a payment amount across the entries the user picked, in the order
//    they appear in the list. Each entry only takes up to what it still owes;
//    leftover spills into the next selected entry. ────────────────────────────
function allocatePayment(amount, items) {
  let remaining = amount;
  const allocations = [];
  for (const item of items) {
    if (remaining <= 0.009) break;
    const due = item.amount - (item.paid_amount || 0);
    const applied = Math.min(due, remaining);
    if (applied > 0.009) {
      allocations.push({ entryId: item.id, amount: applied });
      remaining -= applied;
    }
  }
  return { allocations, remaining };
}

// ── Inline date picker (reused from add-entry) ────────────────────────────────
function DatePicker({ value, onChange }) {
  const { language } = useLanguage();
  const d = isoToDate(value);
  const day = d.getDate(),
    month = d.getMonth(),
    year = d.getFullYear();
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
    // Due date can only be today or future
    if (nd < new Date(new Date().setHours(0, 0, 0, 0))) return;
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

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateToISO(d);
}

const dp = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: colors.white,
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const custId = Number(id);

  const [customer, setCustomer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [overdueEntries, setOverdueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settleAllModalVisible, setSettleAllModalVisible] = useState(false);
  const [settleAllConfirmText, setSettleAllConfirmText] = useState("");
  const [settleEntryModalVisible, setSettleEntryModalVisible] = useState(false);
  const [settleEntryConfirmText, setSettleEntryConfirmText] = useState("");
  const [pendingSettleEntryId, setPendingSettleEntryId] = useState(null);

  // Overdue modal state
  const [overdueModalVisible, setOverdueModalVisible] = useState(false);
  const [newDueDate, setNewDueDate] = useState(tomorrowISO());
  const [updatingDue, setUpdatingDue] = useState(false);

  // Receive Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedEntryIds, setSelectedEntryIds] = useState(new Set());
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Add Phone modal state — shown when Call or WhatsApp tapped with no number saved
  const [addPhoneModalVisible, setAddPhoneModalVisible] = useState(false);
  // Tracks which action triggered AddPhone so we can proceed correctly after saving
  const [pendingActionAfterPhone, setPendingActionAfterPhone] = useState(null); // "call" | "whatsapp"

  // WhatsApp template picker sheet
  const [waPickerVisible, setWaPickerVisible] = useState(false);
  // Shop name — read from local profile, used in
  // WhatsApp message templates so they read "reminder from <Shop Name>".
  const [shopName, setShopName] = useState("");

  const pendingEntries = entries.filter((e) => !e.settled);
  const parsedPaymentAmount = parseFloat(paymentAmount.replace(/,/g, "")) || 0;
  // Paying more than what's currently pending: this clears every pending
  // item automatically (no manual selection needed) and the extra becomes
  // an advance balance on the customer's profile instead of being rejected.
  const isOverpayment =
    parsedPaymentAmount > 0 && parsedPaymentAmount > pendingAmount;
  const selectedItemsInOrder = isOverpayment
    ? pendingEntries
    : pendingEntries.filter((e) => selectedEntryIds.has(e.id));
  const { allocations: paymentAllocations, remaining: unallocatedRemaining } =
    allocatePayment(parsedPaymentAmount, selectedItemsInOrder);
  const appliedMap = Object.fromEntries(
    paymentAllocations.map((a) => [a.entryId, a.amount]),
  );
  const allocatedTotal = parsedPaymentAmount - unallocatedRemaining;
  // Once every pending item is covered, anything left over is the advance
  // amount that will be recorded on the customer's khata.
  const advanceAmount = isOverpayment ? unallocatedRemaining : 0;

  const canSavePayment = isOverpayment
    ? true
    : parsedPaymentAmount > 0 &&
      unallocatedRemaining <= 0.009 &&
      paymentAllocations.length > 0;

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadShopName();
    }, [custId]),
  );

  async function loadShopName() {
    try {
      const profile = await getLocalProfile();
      setShopName(profile.shopName || "");
    } catch (e) {
      console.error("loadShopName error:", e);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [cust, allEntries, pending, overdue, credit] = await Promise.all([
        getCustomer(custId),
        getEntriesForCustomer(custId),
        getPendingAmountForCustomer(custId),
        getOverdueEntries(custId),
        getCustomerCreditBalance(custId),
      ]);
      setCustomer(cust);
      const sorted = [
        ...allEntries.filter((e) => !e.settled),
        ...allEntries.filter((e) => e.settled),
      ];
      setEntries(sorted);
      setPendingAmount(pending);
      setOverdueEntries(overdue);
      setCreditBalance(credit);
    } catch (e) {
      console.error("CustomerDetail loadData error:", e);
    } finally {
      setLoading(false);
    }
  }

  const SETTLE_CONFIRM_THRESHOLD = 200;

  async function doSettleEntry(entryId) {
    try {
      await settleEntry(entryId);
      await loadData();
    } catch (e) {
      Alert.alert(t.error, t.retry);
    }
  }

  function handleSettle(entryId) {
    const entry = entries.find((e) => e.id === entryId);
    const remaining = entry ? entry.amount - (entry.paid_amount || 0) : 0;

    if (remaining < SETTLE_CONFIRM_THRESHOLD) {
      // Small amount — plain confirm alert is enough friction
      Alert.alert(
        t.settleConfirmTitle || "Settle this udhar?",
        t.settleConfirmMessage
          ? t.settleConfirmMessage(formatRupees(remaining))
          : `Mark ${formatRupees(remaining)} as settled?`,
        [
          { text: t.cancel, style: "cancel" },
          { text: t.confirm || "OK", onPress: () => doSettleEntry(entryId) },
        ],
      );
    } else {
      // Larger amount — require typing "confirm" like Settle All
      setPendingSettleEntryId(entryId);
      setSettleEntryConfirmText("");
      setSettleEntryModalVisible(true);
    }
  }

  async function confirmSettleEntry() {
    const entryId = pendingSettleEntryId;
    setSettleEntryModalVisible(false);
    setPendingSettleEntryId(null);
    setSettleEntryConfirmText("");
    if (entryId != null) await doSettleEntry(entryId);
  }

  const settleEntryConfirmValid =
    settleEntryConfirmText.trim().toLowerCase() === "confirm";
  const pendingSettleEntry = entries.find((e) => e.id === pendingSettleEntryId);
  const pendingSettleRemaining = pendingSettleEntry
    ? pendingSettleEntry.amount - (pendingSettleEntry.paid_amount || 0)
    : 0;

  function handleSettleAll() {
    setSettleAllConfirmText("");
    setSettleAllModalVisible(true);
  }

  async function confirmSettleAll() {
    setSettleAllModalVisible(false);
    setSettling(true);
    try {
      await settleAllEntries(custId);
      await loadData();
    } catch (e) {
      Alert.alert(t.error, t.retry);
    } finally {
      setSettling(false);
      setSettleAllConfirmText("");
    }
  }

  const settleAllConfirmValid =
    settleAllConfirmText.trim().toLowerCase() === "confirm";

  function handleDeleteCustomer() {
    const name = customer?.name ?? "";
    Alert.alert(
      t.deleteCustomerTitle || "Delete customer?",
      t.deleteCustomerMessage
        ? t.deleteCustomerMessage(name)
        : `This will permanently delete ${name} and all their udhar entries and payment history. This cannot be undone.`,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete || "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteCustomer(custId);
              router.back();
            } catch (e) {
              console.error("deleteCustomer error:", e);
              Alert.alert(t.error, t.retry);
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  async function handleUpdateOverdue() {
    setUpdatingDue(true);
    try {
      await updateOverdueDates(custId, newDueDate);
      setOverdueModalVisible(false);
      await loadData();
    } catch (e) {
      Alert.alert(t.error, t.retry);
    } finally {
      setUpdatingDue(false);
    }
  }

  function handleCallPress() {
    if (customer?.phone) {
      dialNumber(customer.phone, t);
    } else {
      setPendingActionAfterPhone("call");
      setAddPhoneModalVisible(true);
    }
  }

  function handleWhatsAppPress() {
    if (customer?.phone) {
      setWaPickerVisible(true);
    } else {
      setPendingActionAfterPhone("whatsapp");
      setAddPhoneModalVisible(true);
    }
  }

  async function handleSavePhone(phone) {
    await updateCustomerPhone(custId, phone);
    setCustomer((prev) => (prev ? { ...prev, phone } : prev));
    setAddPhoneModalVisible(false);
    // Continue with the action that originally triggered the AddPhone modal
    if (pendingActionAfterPhone === "call") {
      dialNumber(phone, t);
    } else if (pendingActionAfterPhone === "whatsapp") {
      setWaPickerVisible(true);
    }
    setPendingActionAfterPhone(null);
  }

  async function handleWaSend(selectedKeys) {
    if (!selectedKeys.length) return;
    const buckets = bucketEntries(pendingEntries);
    const message = buildCombinedMessage({
      selectedKeys,
      buckets,
      customerName: customer?.name ?? "",
      t,
      language,
      shopName: shopName || undefined, // falls back to "us" / "हमारी तरफ़ से" in the template if empty
    });
    setWaPickerVisible(false);
    await openWhatsAppChat(customer.phone, message, t);
  }

  function openPaymentModal() {
    setPaymentAmount("");
    setSelectedEntryIds(new Set());
    setPaymentModalVisible(true);
  }

  function closePaymentModal() {
    setPaymentModalVisible(false);
  }

  function handlePaymentAmountChange(text) {
    setPaymentAmount(text.replace(/[^0-9.]/g, ""));
  }

  function toggleEntrySelection(entryId) {
    // While overpaying, every pending item is auto-selected and cleared —
    // manual toggling would be misleading, so it's a no-op here.
    if (isOverpayment) return;
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  async function handleRecordPayment() {
    if (!canSavePayment) return;
    setRecordingPayment(true);
    try {
      await recordPayment({
        customerId: custId,
        amount: parsedPaymentAmount,
        allocations: paymentAllocations,
        date: todayISO(),
      });
      setPaymentModalVisible(false);
      await loadData();
    } catch (e) {
      console.error("recordPayment error:", e);
      Alert.alert(t.error, t.retry);
    } finally {
      setRecordingPayment(false);
    }
  }

  const isFullySettled = !loading && pendingAmount === 0 && entries.length > 0;
  const hasUnsettled = pendingAmount > 0;
  const hasOverdue = overdueEntries.length > 0;

  // ── Overdue banner ────────────────────────────────────────────────────────
  function OverdueBanner() {
    if (!hasOverdue) return null;
    return (
      <Pressable
        style={({ pressed }) => [
          overdue.banner,
          pressed && overdue.bannerPressed,
        ]}
        onPress={() => setOverdueModalVisible(true)}
      >
        <View style={overdue.iconWrap}>
          <Text style={overdue.icon}>⚠️</Text>
        </View>
        <View style={overdue.left}>
          <Text style={overdue.title}>
            {t.overdueTitle(overdueEntries.length)}
          </Text>
          <Text style={overdue.sub}>{t.overdueSubtitle}</Text>
        </View>
        <View style={overdue.updateBtn}>
          <Text style={overdue.updateBtnText}>{t.updateDueDate}</Text>
        </View>
      </Pressable>
    );
  }

  // ── List header ───────────────────────────────────────────────────────────
  function ListHeader() {
    return (
      <View>
        <OverdueBanner />

        <View style={styles.hero}>
          <AvatarCircle name={customer?.name ?? ""} size={68} elevated />
          <Text style={styles.customerName}>{customer?.name ?? "..."}</Text>
          {customer?.phone ? (
            <View style={styles.phoneChip}>
              <Text style={styles.phoneChipIcon}>📞</Text>
              <Text style={styles.customerPhone}>{customer.phone}</Text>
            </View>
          ) : null}

          <View style={styles.contactActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.contactAction,
                pressed && styles.contactActionPressed,
              ]}
              onPress={handleCallPress}
            >
              <View style={[styles.contactIconCircle, styles.callIconCircle]}>
                <Ionicons name="call" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.contactLabel, styles.callLabel]}>
                {t.call}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.contactAction,
                pressed && styles.contactActionPressed,
              ]}
              onPress={handleWhatsAppPress}
            >
              <View
                style={[styles.contactIconCircle, styles.whatsappIconCircle]}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={22}
                  color={colors.whatsapp}
                />
              </View>
              <Text style={[styles.contactLabel, styles.whatsappLabel]}>
                {t.whatsapp}
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {isFullySettled ? (
            <View style={styles.statusRow}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={colors.success}
              />
              <Text style={styles.statusRowText}>{t.allSettled}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.pendingLabel}>{t.totalPending}</Text>
              <Text style={styles.pendingAmount}>
                {formatRupees(pendingAmount)}
              </Text>
            </>
          )}

          {creditBalance > 0.009 && (
            <View style={styles.creditRow}>
              <Ionicons
                name="arrow-up-circle"
                size={14}
                color={colors.success}
              />
              <Text style={styles.creditRowText}>
                {t.advanceBalance} ·{" "}
                <Text style={styles.creditRowAmount}>
                  {formatRupees(creditBalance)}
                </Text>
              </Text>
            </View>
          )}

          {isFullySettled ? (
            <Pressable
              style={({ pressed }) => [
                styles.receivePaymentBtn,
                styles.receivePaymentBtnFullWidth,
                pressed && styles.receivePaymentPressed,
              ]}
              onPress={openPaymentModal}
            >
              <Text style={styles.receivePaymentText}>
                {t.receivePayment}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.receivePaymentBtn,
                  pressed && styles.receivePaymentPressed,
                ]}
                onPress={openPaymentModal}
                disabled={!hasUnsettled}
              >
                <Text style={styles.receivePaymentText}>
                  {t.receivePayment}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.settleAllBtn,
                  pressed && styles.settleAllPressed,
                  settling && styles.settleAllDisabled,
                ]}
                onPress={handleSettleAll}
                disabled={settling || !hasUnsettled}
              >
                {settling ? (
                  <ActivityIndicator color={colors.success} size="small" />
                ) : (
                  <Text style={styles.settleAllText}>{t.markAllPaid}</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {entries.length > 0 && (
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>{t.allEntriesLabel}</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{entries.length}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  function ListEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>📒</Text>
        <Text style={styles.emptyText}>{t.noEntries}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView key={language} style={styles.safe} edges={["top"]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>‹ {t.back}</Text>
        </Pressable>
        <View style={styles.navBarRight}>
          <Pressable
            onPress={handleDeleteCustomer}
            hitSlop={12}
            style={styles.deleteBtn}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/add-entry")}
            hitSlop={12}
            style={styles.addBtn}
          >
            <Text style={styles.addText}>{t.addUdharShort}</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 60 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EntryRow entry={item} onSettle={handleSettle} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<ListEmpty />}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.emptyContent,
          ]}
          style={styles.list}
        />
      )}

      {/* ── Overdue date update modal ── */}
      <Modal
        visible={overdueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOverdueModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={modal.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <Pressable
          style={modal.backdrop}
          onPress={() => setOverdueModalVisible(false)}
        />
        <View style={modal.sheet}>
          {/* Handle */}
          <View style={modal.handle} />

          <Text style={modal.title}>{t.updateDueDateTitle}</Text>
          <Text style={modal.subtitle}>
            {t.updateDueDateSubtitle(
              overdueEntries.length,
              customer?.name ?? "",
            )}
          </Text>

          <View style={modal.pickerWrap}>
            <DatePicker value={newDueDate} onChange={setNewDueDate} />
            <Text style={modal.datePreview}>{formatDateHindi(newDueDate)}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              modal.confirmBtn,
              pressed && modal.confirmBtnPressed,
              updatingDue && modal.confirmBtnDisabled,
            ]}
            onPress={handleUpdateOverdue}
            disabled={updatingDue}
          >
            {updatingDue ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={modal.confirmBtnText}>{t.updateDueDateConfirm}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setOverdueModalVisible(false)}
            style={modal.cancelBtn}
          >
            <Text style={modal.cancelText}>{t.cancel}</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Receive Payment modal ── */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <KeyboardAvoidingView
          style={modal.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <Pressable style={modal.backdrop} onPress={closePaymentModal} />
        <View style={[modal.sheet, payment.sheet]}>
          <View style={modal.handle} />

          <Text style={modal.title}>{t.receivePaymentTitle}</Text>
          <Text style={modal.subtitle}>
            {t.receivePaymentSubtitle(customer?.name ?? "")}
          </Text>

          <View style={payment.amountRow}>
            <Text style={payment.rupeeSymbol}>₹</Text>
            <TextInput
              style={payment.amountInput}
              value={paymentAmount}
              onChangeText={handlePaymentAmountChange}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              maxLength={8}
            />
          </View>

          {isOverpayment ? (
            <Text style={[payment.allocatedText, payment.allocatedTextDone]}>
              {t.advanceWillBeAdded(formatRupees(advanceAmount))}
            </Text>
          ) : parsedPaymentAmount > 0 ? (
            <Text
              style={[
                payment.allocatedText,
                canSavePayment && payment.allocatedTextDone,
              ]}
            >
              {t.allocatedOfAmount(
                formatRupees(allocatedTotal),
                formatRupees(parsedPaymentAmount),
              )}
              {!canSavePayment ? ` — ${t.selectMoreItemsHint}` : ""}
            </Text>
          ) : null}

          {pendingEntries.length > 0 && (
            <Text style={payment.sectionLabel}>{t.selectItemsLabel}</Text>
          )}

          <ScrollView
            style={payment.itemList}
            keyboardShouldPersistTaps="handled"
          >
            {pendingEntries.length === 0 ? (
              <Text style={payment.emptyText}>{t.noPendingItems}</Text>
            ) : (
              pendingEntries.map((item) => {
                const due = item.amount - (item.paid_amount || 0);
                const isSelected = isOverpayment || selectedEntryIds.has(item.id);
                const applied = appliedMap[item.id] || 0;
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      payment.itemRow,
                      isSelected && payment.itemRowSelected,
                    ]}
                    onPress={() => toggleEntrySelection(item.id)}
                  >
                    <View
                      style={[
                        payment.checkbox,
                        isSelected && payment.checkboxChecked,
                      ]}
                    >
                      {isSelected && (
                        <Text style={payment.checkboxMark}>✓</Text>
                      )}
                    </View>
                    <View style={payment.itemInfo}>
                      <Text style={payment.itemNote} numberOfLines={1}>
                        {item.note || relativeLabel(item.date)}
                      </Text>
                      <Text style={payment.itemDue}>
                        {formatRupees(due)} {t.pendingTag}
                      </Text>
                    </View>
                    {isSelected && applied > 0.009 && (
                      <View style={payment.appliedBadge}>
                        <Text style={payment.appliedBadgeText}>
                          {t.appliedTag(formatRupees(applied))}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              modal.confirmBtn,
              pressed && modal.confirmBtnPressed,
              (!canSavePayment || recordingPayment) && modal.confirmBtnDisabled,
            ]}
            onPress={handleRecordPayment}
            disabled={!canSavePayment || recordingPayment}
          >
            {recordingPayment ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={modal.confirmBtnText}>{t.recordPaymentBtn}</Text>
            )}
          </Pressable>

          <Pressable onPress={closePaymentModal} style={modal.cancelBtn}>
            <Text style={modal.cancelText}>{t.cancel}</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Settle all confirmation modal (requires typing "confirm") ── */}
      <Modal
        visible={settleAllModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettleAllModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={modal.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <Pressable
          style={modal.backdrop}
          onPress={() => setSettleAllModalVisible(false)}
        />
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>{t.settleAllTitle || "Settle all?"}</Text>
          <Text style={modal.subtitle}>
            {t.settleAllMessage
              ? t.settleAllMessage(customer?.name ?? "")
              : `Mark all of ${customer?.name ?? "this customer"}'s udhar as settled?`}
          </Text>

          <TextInput
            style={modal.confirmInput}
            value={settleAllConfirmText}
            onChangeText={setSettleAllConfirmText}
            placeholder={
              t.typeConfirmPlaceholder || 'Type "confirm" to proceed'
            }
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={({ pressed }) => [
              modal.confirmBtn,
              modal.confirmBtnDanger,
              pressed && modal.confirmBtnPressed,
              (!settleAllConfirmValid || settling) && modal.confirmBtnDisabled,
            ]}
            onPress={confirmSettleAll}
            disabled={!settleAllConfirmValid || settling}
          >
            {settling ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={modal.confirmBtnText}>{t.confirm || "Confirm"}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setSettleAllModalVisible(false)}
            style={modal.cancelBtn}
          >
            <Text style={modal.cancelText}>{t.cancel}</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Settle single entry confirmation modal (amounts >= ₹200) ── */}
      <Modal
        visible={settleEntryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettleEntryModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={modal.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <Pressable
          style={modal.backdrop}
          onPress={() => setSettleEntryModalVisible(false)}
        />
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <Text style={modal.title}>
            {t.settleConfirmTitle || "Settle this udhar?"}
          </Text>
          <Text style={modal.subtitle}>
            {t.settleConfirmMessage
              ? t.settleConfirmMessage(formatRupees(pendingSettleRemaining))
              : `Mark ${formatRupees(pendingSettleRemaining)} as settled?`}
          </Text>

          <TextInput
            style={modal.confirmInput}
            value={settleEntryConfirmText}
            onChangeText={setSettleEntryConfirmText}
            placeholder={
              t.typeConfirmPlaceholder || 'Type "confirm" to proceed'
            }
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={({ pressed }) => [
              modal.confirmBtn,
              modal.confirmBtnDanger,
              pressed && modal.confirmBtnPressed,
              !settleEntryConfirmValid && modal.confirmBtnDisabled,
            ]}
            onPress={confirmSettleEntry}
            disabled={!settleEntryConfirmValid}
          >
            <Text style={modal.confirmBtnText}>{t.confirm || "Confirm"}</Text>
          </Pressable>

          <Pressable
            onPress={() => setSettleEntryModalVisible(false)}
            style={modal.cancelBtn}
          >
            <Text style={modal.cancelText}>{t.cancel}</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Phone modal (shown when Call/WhatsApp tapped with no number) ── */}
      <AddPhoneModal
        visible={addPhoneModalVisible}
        customerName={customer?.name}
        onClose={() => {
          setAddPhoneModalVisible(false);
          setPendingActionAfterPhone(null);
        }}
        onSave={handleSavePhone}
      />

      {/* ── WhatsApp template picker sheet ── */}
      <WaPickerModal
        visible={waPickerVisible}
        customerName={customer?.name ?? ""}
        pendingEntries={pendingEntries}
        t={t}
        onClose={() => setWaPickerVisible(false)}
        onSend={handleWaSend}
      />
    </SafeAreaView>
  );
}

// ── Overdue banner styles ─────────────────────────────────────────────────────
const overdue = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  bannerPressed: { opacity: 0.85 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  left: { flex: 1, gap: 1 },
  icon: { fontSize: 16 },
  title: { fontSize: 13, fontWeight: "700", color: colors.danger },
  sub: { fontSize: 11, color: colors.danger, opacity: 0.8, marginTop: 1 },
  updateBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  updateBtnText: { fontSize: 12, fontWeight: "700", color: colors.white },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  kav: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  pickerWrap: { gap: 8 },
  datePreview: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  confirmBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnDanger: { backgroundColor: colors.danger },
  confirmInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlign: "center",
    letterSpacing: 1,
  },
  confirmBtnPressed: { opacity: 0.85 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  cancelBtn: { alignItems: "center", paddingVertical: 4 },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
});

// ── Receive Payment modal styles ──────────────────────────────────────────────
const payment = StyleSheet.create({
  sheet: { maxHeight: "85%" },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 56,
    paddingLeft: 16,
  },
  rupeeSymbol: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.danger,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: colors.danger,
    height: 56,
  },

  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "600",
    textAlign: "center",
  },
  allocatedText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  allocatedTextDone: { color: colors.success, fontWeight: "700" },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 4,
  },

  itemList: { maxHeight: 260 },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
    paddingVertical: 16,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemRowSelected: { backgroundColor: colors.primaryLight },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: { fontSize: 12, fontWeight: "700", color: colors.white },

  itemInfo: { flex: 1, gap: 2 },
  itemNote: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  itemDue: { fontSize: 12, color: colors.danger, fontWeight: "600" },

  appliedBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  appliedBadgeText: { fontSize: 11, fontWeight: "700", color: colors.success },
});

// ── Main screen styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 2,
  },
  backText: { fontSize: 15, color: colors.primary, fontWeight: "700" },
  navBarRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },

  // Floating profile card
  hero: {
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  customerName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 14,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  phoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  phoneChipIcon: { fontSize: 11 },
  customerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  contactActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 36,
    marginTop: 14,
  },
  contactAction: { alignItems: "center", gap: 6 },
  contactActionPressed: { opacity: 0.7 },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  callIconCircle: { backgroundColor: colors.primaryLight },
  whatsappIconCircle: { backgroundColor: colors.whatsappLight },
  contactLabel: { fontSize: 12, fontWeight: "700" },
  callLabel: { color: colors.primary },
  whatsappLabel: { color: colors.whatsapp },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  pendingLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  pendingAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -1,
    lineHeight: 46,
    marginTop: 4,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  receivePaymentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  receivePaymentPressed: { opacity: 0.85 },
  receivePaymentText: { fontSize: 14, fontWeight: "700", color: colors.white },

  settleAllBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 6,
  },
  settleAllPressed: { opacity: 0.75 },
  settleAllDisabled: { opacity: 0.4 },
  settleAllText: { fontSize: 14, fontWeight: "700", color: colors.success },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusRowText: { fontSize: 16, fontWeight: "700", color: colors.success },

  receivePaymentBtnFullWidth: { width: "100%", marginTop: 16 },

  // Compact one-line credit note — replaces the old boxed "advance balance"
  // panel so a settled khata with a carried-forward amount doesn't stack
  // three separate colored blocks on top of each other.
  creditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  creditRowText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  creditRowAmount: { color: colors.success, fontWeight: "700" },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionCount: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  list: { flex: 1 },
  listContent: { paddingTop: 2, paddingBottom: 28 },
  emptyContent: { flexGrow: 1 },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});

// ── WhatsApp template picker modal ───────────────────────────────────────────
// Bottom sheet with checkboxes for each available bucket + a combined Send button.
// Disabled (greyed) when a bucket has zero items.

const SEND_ORDER = ["dueToday", "overdue", "noDate"];

function WaPickerModal({
  visible,
  customerName,
  pendingEntries,
  t,
  onClose,
  onSend,
}) {
  const buckets = bucketEntries(pendingEntries);

  // Default: pre-tick every bucket that has items
  const defaultSelected = () =>
    new Set(SEND_ORDER.filter((k) => buckets[k]?.length > 0));

  const [selected, setSelected] = useState(defaultSelected);

  // Reset selection whenever the sheet opens
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current) setSelected(defaultSelected());
    prevVisible.current = visible;
  }, [visible]);

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const BUCKET_META = {
    noDate: {
      emoji: "📋",
      label: t.waTemplateNoDateLabel,
      sub: t.waTemplateNoDateSub,
    },
    dueToday: {
      emoji: "⏰",
      label: t.waTemplateDueTodayLabel,
      sub: t.waTemplateDueTodaySub,
    },
    overdue: {
      emoji: "⚠️",
      label: t.waTemplateOverdueLabel,
      sub: t.waTemplateOverdueSub,
    },
  };

  const noneSelected = selected.size === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={waPicker.backdrop} onPress={onClose} />
      <View style={waPicker.sheet}>
        <View style={waPicker.handle} />

        {/* Header */}
        <View style={waPicker.headerRow}>
          <View style={waPicker.waIconWrap}>
            <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
          </View>
          <View style={waPicker.headerText}>
            <Text style={waPicker.title}>{t.waPickerTitle}</Text>
            <Text style={waPicker.subtitle}>
              {t.waPickerSubtitle(customerName)}
            </Text>
          </View>
        </View>

        {/* Bucket options with checkboxes */}
        {SEND_ORDER.map((key) => {
          const meta = BUCKET_META[key];
          const count = buckets[key]?.length ?? 0;
          const disabled = count === 0;
          const checked = selected.has(key);
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [
                waPicker.option,
                checked && !disabled && waPicker.optionChecked,
                disabled && waPicker.optionDisabled,
                !disabled && pressed && waPicker.optionPressed,
              ]}
              onPress={() => !disabled && toggle(key)}
              disabled={disabled}
            >
              {/* Checkbox */}
              <View
                style={[
                  waPicker.checkbox,
                  checked && !disabled && waPicker.checkboxChecked,
                  disabled && waPicker.checkboxDisabled,
                ]}
              >
                {checked && !disabled && (
                  <Ionicons name="checkmark" size={13} color={colors.white} />
                )}
              </View>

              <Text
                style={[
                  waPicker.optionEmoji,
                  disabled && waPicker.textDisabled,
                ]}
              >
                {meta.emoji}
              </Text>

              <View style={waPicker.optionBody}>
                <Text
                  style={[
                    waPicker.optionLabel,
                    disabled && waPicker.textDisabled,
                  ]}
                >
                  {meta.label}
                </Text>
                <Text
                  style={[
                    waPicker.optionSub,
                    disabled && waPicker.textDisabled,
                  ]}
                >
                  {disabled
                    ? t.waTemplateEmptyHint
                    : `${count} item${count === 1 ? "" : "s"}`}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Send button */}
        <Pressable
          style={({ pressed }) => [
            waPicker.sendBtn,
            pressed && waPicker.sendBtnPressed,
            noneSelected && waPicker.sendBtnDisabled,
          ]}
          onPress={() => !noneSelected && onSend([...selected])}
          disabled={noneSelected}
        >
          <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
          <Text style={waPicker.sendBtnText}>{t.waSendBtn}</Text>
        </Pressable>

        <Pressable onPress={onClose} style={waPicker.cancelBtn}>
          <Text style={waPicker.cancelText}>{t.cancel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const waPicker = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 8,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  waIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whatsappLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  // Option rows
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  optionChecked: {
    borderColor: colors.whatsapp,
    backgroundColor: colors.whatsappLight,
  },
  optionDisabled: { opacity: 0.4 },
  optionPressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },

  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.whatsapp,
    borderColor: colors.whatsapp,
  },
  checkboxDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  optionEmoji: { fontSize: 20, width: 26, textAlign: "center" },
  optionBody: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  optionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  textDisabled: { color: colors.textTertiary },

  // Send button
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    height: 52,
    backgroundColor: colors.whatsapp,
    borderRadius: 14,
    shadowColor: colors.whatsapp,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnPressed: { opacity: 0.85 },
  sendBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  sendBtnText: { fontSize: 16, fontWeight: "700", color: colors.white },

  cancelBtn: { alignItems: "center", paddingVertical: 4, marginTop: 2 },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },
});
