/**
 * app/pending.jsx
 * Pending / Settled customer list screen.
 * Reached via the bottom tab bar's "Pending" / "Settled" buttons.
 * Which tab is active is driven by the `?mode=pending|settled` param
 * so the footer can deep-link straight into either one.
 */

import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Keyboard,
  ScrollView,
  Modal,
} from "react-native";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import StatBar from "../components/StatBar";
import CustomerRow from "../components/CustomerRow";
import SettledCustomerRow from "../components/SettledCustomerRow";
import EmptyState from "../components/EmptyState";
import SettledEmptyState from "../components/SettledEmptyState";
import BottomTabBar from "../components/BottomTabBar";

import { useCustomers } from "../hooks/useCustomers";
import { useSettledCustomers } from "../hooks/useSettledCustomers";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { formatRupees } from "../lib/date";

export default function PendingScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const { t } = useLanguage();
  const {
    customers: pendingCustomers,
    dueToday,
    stats,
    loading: pendingLoading,
    refreshing: pendingRefreshing,
    sort: pendingSort,
    setSort: setPendingSort,
    refresh: refreshPending,
  } = useCustomers();

  const [listMode, setListMode] = useState(
    mode === "settled" ? "settled" : "pending",
  ); // "pending" | "settled"

  // Keep in sync if the footer navigates here again with a different ?mode=
  useEffect(() => {
    if (mode === "settled" || mode === "pending") {
      setListMode(mode);
    }
  }, [mode]);

  const {
    customers: settledCustomers,
    stats: settledStats,
    loading: settledLoading,
    refreshing: settledRefreshing,
    sort: settledSort,
    setSort: setSettledSort,
    refresh: refreshSettled,
  } = useSettledCustomers("recent", listMode === "settled");

  const isPendingMode = listMode === "pending";
  const customers = isPendingMode ? pendingCustomers : settledCustomers;
  const loading = isPendingMode ? pendingLoading : settledLoading;
  const refreshing = isPendingMode ? pendingRefreshing : settledRefreshing;
  const sort = isPendingMode ? pendingSort : settledSort;
  const setSort = isPendingMode ? setPendingSort : setSettledSort;
  const refresh = isPendingMode ? refreshPending : refreshSettled;

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [overdueModalVisible, setOverdueModalVisible] = useState(false);

  const SORT_OPTIONS = [
    { key: "highest", label: t.filterHighest },
    { key: "recent", label: t.filterRecent },
    { key: "name", label: t.filterName },
  ];

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    const digitsQuery = q.replace(/\D/g, "");
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneMatch =
        digitsQuery.length > 0 &&
        !!c.phone &&
        c.phone.replace(/\D/g, "").includes(digitsQuery);
      return nameMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  // Overdue customers derived from the list (overdue_count comes from db query)
  const overdueCustomers = useMemo(
    () => customers.filter((c) => c.overdue_count > 0),
    [customers],
  );

  function openSearch() {
    setSearchActive(true);
  }
  function closeSearch() {
    setSearchActive(false);
    setSearchQuery("");
    Keyboard.dismiss();
  }

  // ── Overdue banner ─────────────────────────────────────────────────────────
  function handleBannerPress() {
    if (overdueCustomers.length === 1) {
      // Go directly to that customer's profile
      router.push(`/customer/${overdueCustomers[0].id}`);
    } else {
      // Show picker modal
      setOverdueModalVisible(true);
    }
  }

  function OverdueBanner() {
    if (overdueCustomers.length === 0) return null;
    const isSingle = overdueCustomers.length === 1;
    return (
      <Pressable
        style={({ pressed }) => [banner.container, pressed && banner.pressed]}
        onPress={handleBannerPress}
      >
        <View style={banner.left}>
          <Text style={banner.icon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={banner.title}>
              {isSingle
                ? t.overdueBannerSingle(overdueCustomers[0].name)
                : t.overdueBannerMultiple(overdueCustomers.length)}
            </Text>
            <Text style={banner.sub}>
              {isSingle ? t.overdueBannerSubSingle : t.overdueBannerSubMultiple}
            </Text>
          </View>
        </View>
        <View style={banner.arrow}>
          <Text style={banner.arrowText}>›</Text>
        </View>
      </Pressable>
    );
  }

  // ── Overdue customers modal (shown when 2+ overdue) ────────────────────────
  function OverdueModal() {
    return (
      <Modal
        visible={overdueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOverdueModalVisible(false)}
      >
        <Pressable
          style={modal.backdrop}
          onPress={() => setOverdueModalVisible(false)}
        >
          {/* Stop backdrop press from bubbling into the sheet */}
          <Pressable style={modal.sheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <View style={modal.handle} />

            <Text style={modal.title}>⚠️ {t.overdueModalTitle}</Text>
            <Text style={modal.subtitle}>{t.overdueModalSubtitle}</Text>

            <ScrollView
              style={modal.list}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {overdueCustomers.map((c, idx) => (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [
                    modal.row,
                    pressed && modal.rowPressed,
                    idx === overdueCustomers.length - 1 && modal.rowLast,
                  ]}
                  onPress={() => {
                    setOverdueModalVisible(false);
                    router.push(`/customer/${c.id}`);
                  }}
                >
                  {/* Avatar */}
                  <View style={modal.avatar}>
                    <Text style={modal.avatarLetter}>
                      {c.name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={modal.rowInfo}>
                    <Text style={modal.rowName}>{c.name}</Text>
                    <Text style={modal.rowOverdue}>
                      {t.overdueEntryCount(c.overdue_count)}
                    </Text>
                  </View>

                  <View style={modal.rowRight}>
                    <Text style={modal.rowAmount}>
                      {formatRupees(c.pending)}
                    </Text>
                    <Text style={modal.rowArrow}>›</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={modal.closeBtn}
              onPress={() => setOverdueModalVisible(false)}
            >
              <Text style={modal.closeBtnText}>{t.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // ── Due Today strip ────────────────────────────────────────────────────────
  function DueTodayStrip() {
    if (dueToday.length === 0) return null;
    return (
      <View style={due.container}>
        <View style={due.header}>
          <Text style={due.headerIcon}>⏰</Text>
          <Text style={due.headerTitle}>{t.dueTodaySection}</Text>
          <View style={due.badge}>
            <Text style={due.badgeText}>{dueToday.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={due.scroll}
        >
          {dueToday.map((customer) => (
            <Pressable
              key={customer.id}
              style={({ pressed }) => [due.card, pressed && due.cardPressed]}
              onPress={() => router.push(`/customer/${customer.id}`)}
            >
              <View style={due.avatarCircle}>
                <Text style={due.avatarLetter}>
                  {customer.name.trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={due.customerName} numberOfLines={1}>
                {customer.name}
              </Text>
              <Text style={due.amount}>{formatRupees(customer.pending)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── List header ────────────────────────────────────────────────────────────
  function renderHeader() {
    if (searchActive) return null;
    return (
      <>
        {isPendingMode ? (
          <>
            <OverdueBanner />
            <StatBar
              totalPending={stats.totalPending}
              todayReceived={stats.todayReceived}
            />
            <DueTodayStrip />
          </>
        ) : (
          <StatBar
            totalPending={settledStats.totalReceived}
            todayReceived={settledStats.todayReceived}
            leftLabel={t.totalReceived}
            leftColor={colors.success}
          />
        )}
        <View style={styles.pillRow}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.pill, sort === opt.key && styles.pillActive]}
              onPress={() => setSort(opt.key)}
            >
              <Text
                style={[
                  styles.pillText,
                  sort === opt.key && styles.pillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  }

  function ListEmpty() {
    if (loading) return null;
    if (searchQuery.trim()) {
      return (
        <View style={styles.noResults}>
          <Text style={styles.noResultsIcon}>🔍</Text>
          <Text style={styles.noResultsTitle}>
            {t.noResultsTitle(searchQuery.trim())}
          </Text>
          <Text style={styles.noResultsSub}>{t.noResultsSub}</Text>
        </View>
      );
    }
    if (!isPendingMode) {
      return <SettledEmptyState />;
    }
    return <EmptyState />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      {searchActive ? (
        <View style={styles.searchBar}>
          <Text style={styles.searchBarIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="words"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={10}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          )}
          <Pressable onPress={closeSearch} hitSlop={12}>
            <Text style={styles.cancelText}>{t.searchCancel}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.screenTitle}>
            {isPendingMode ? t.pendingTabLabel || "Pending" : t.settledTabLabel || "Settled"}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable onPress={openSearch} hitSlop={12}>
              <Text style={styles.searchIconText}>🔍</Text>
            </Pressable>
          </View>
        </View>
      )}

      {searchActive && searchQuery.trim().length > 0 && (
        <View style={styles.resultsBadge}>
          <Text style={styles.resultsBadgeText}>
            {filteredCustomers.length === 0
              ? t.noResultsBadge
              : t.resultsBadge(filteredCustomers.length)}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 60 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) =>
            isPendingMode ? (
              <CustomerRow customer={item} />
            ) : (
              <SettledCustomerRow customer={item} />
            )
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<ListEmpty />}
          contentContainerStyle={
            filteredCustomers.length === 0 && styles.emptyContent
          }
          refreshControl={
            !searchActive ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {!searchActive && filteredCustomers.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push("/add-entry")}
        >
          <Text style={styles.fabText}>{t.addUdhar}</Text>
        </Pressable>
      )}

      {!searchActive && (
        <BottomTabBar
          active={listMode}
          onSelectHome={() => router.replace("/")}
          onSelectPending={() => {
            setListMode("pending");
            router.setParams({ mode: "pending" });
          }}
          onSelectSettled={() => {
            setListMode("settled");
            router.setParams({ mode: "settled" });
          }}
        />
      )}

      {/* Overdue picker modal */}
      <OverdueModal />
    </SafeAreaView>
  );
}

// ── Overdue banner styles ─────────────────────────────────────────────────────
const banner = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  pressed: { opacity: 0.8 },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  icon: { fontSize: 20 },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  sub: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 2,
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 20,
  },
});

// ── Overdue modal styles ──────────────────────────────────────────────────────
const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 12,
    maxHeight: "75%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#DC2626",
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: "#FEF2F2" },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "800",
    color: "#DC2626",
  },

  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  rowOverdue: { fontSize: 12, color: "#EF4444", marginTop: 2 },

  rowRight: { alignItems: "flex-end", gap: 2 },
  rowAmount: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  rowArrow: { fontSize: 20, color: "#9CA3AF", fontWeight: "600" },

  closeBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
});

// ── Due Today styles ──────────────────────────────────────────────────────────
const due = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 4,
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.amber,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: { fontSize: 15 },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.amber,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.amber,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.white },

  scroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 10 },

  card: {
    alignItems: "center",
    backgroundColor: colors.amberLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.amber,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
    minWidth: 88,
  },
  cardPressed: { opacity: 0.75 },

  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 18, fontWeight: "800", color: colors.white },
  customerName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    maxWidth: 80,
    textAlign: "center",
  },
  amount: { fontSize: 13, fontWeight: "800", color: colors.danger },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchIconText: { fontSize: 20 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  searchBarIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 13, color: colors.textTertiary, fontWeight: "600" },
  cancelText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  resultsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsBadgeText: { fontSize: 12, fontWeight: "600", color: colors.primary },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
    flexShrink: 0,
  },
  pillTextActive: { color: colors.primary, fontWeight: "700" },

  list: { flex: 1 },
  emptyContent: { flexGrow: 1 },

  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  noResultsIcon: { fontSize: 40, marginBottom: 4 },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  fab: {
    position: "absolute",
    bottom: 92, // sits above the footer/tab bar instead of the old bottom:50
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  fabText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
