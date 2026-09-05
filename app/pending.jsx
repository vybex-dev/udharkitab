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
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  SlideInRight,
  SlideInLeft,
  SlideOutRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import StatBar from "../components/StatBar";
import CustomerRow from "../components/CustomerRow";
import SettledCustomerRow from "../components/SettledCustomerRow";
import EmptyState from "../components/EmptyState";
import SettledEmptyState from "../components/SettledEmptyState";
import BottomTabBar from "../components/BottomTabBar";
import PressableScale from "../components/PressableScale";

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

  // Guards against playing the slide-in animation on the screen's very
  // first mount (that transition is already handled by the Stack's own
  // slide_from_right push animation from Home) — only a real in-page tab
  // tap below flips this to true. With just two tabs the direction itself
  // needs no extra state: leaving "pending" always means moving forward to
  // "settled" (so it always exits left / the new tab enters from the
  // right), and leaving "settled" always means moving back to "pending"
  // (exits right / enters from the left).
  const hasSwitchedTabRef = useRef(false);

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
      <PressableScale style={banner.container} onPress={handleBannerPress}>
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
      </PressableScale>
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
            <PressableScale
              key={customer.id}
              style={due.card}
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
            </PressableScale>
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
            <PressableScale
              key={opt.key}
              style={[styles.pill, sort === opt.key && styles.pillActive]}
              onPress={() => setSort(opt.key)}
            >
              <Text
                style={[
                  styles.pillText,
                  sort === opt.key && styles.pillTextActive,
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </PressableScale>
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

  // Fixed slide pair for the current tab — see note by hasSwitchedTabRef.
  const tabEnterAnim = listMode === "pending" ? SlideInLeft : SlideInRight;
  const tabExitAnim = listMode === "pending" ? SlideOutLeft : SlideOutRight;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      {searchActive ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={styles.searchBarWrap}
        >
          <View style={styles.searchField}>
            <Ionicons name="search" size={18} color={colors.primary} />
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
                <Ionicons name="close" size={13} color={colors.white} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={closeSearch}
            hitSlop={12}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.cancelBtnPressed,
            ]}
          >
            <Text style={styles.cancelText}>{t.searchCancel}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          key={`header-${listMode}`}
          entering={hasSwitchedTabRef.current ? tabEnterAnim.duration(240) : undefined}
          exiting={tabExitAnim.duration(240)}
          style={styles.header}
        >
          <Text style={styles.screenTitle}>
            {isPendingMode ? t.pendingTab : t.settledTab}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable
              onPress={openSearch}
              hitSlop={8}
              style={({ pressed }) => [
                styles.searchIconBtn,
                pressed && styles.searchIconBtnPressed,
              ]}
            >
              <Ionicons name="search" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {searchActive && searchQuery.trim().length > 0 && (
        <Animated.View entering={FadeIn.duration(150)} style={styles.resultsBadge}>
          <Ionicons
            name={
              filteredCustomers.length === 0
                ? "alert-circle-outline"
                : "people"
            }
            size={13}
            color={colors.primary}
          />
          <Text style={styles.resultsBadgeText} numberOfLines={1}>
            {filteredCustomers.length === 0
              ? t.noResultsBadge
              : t.resultsBadge(filteredCustomers.length)}
          </Text>
        </Animated.View>
      )}

      <Animated.View
        key={`content-${listMode}`}
        entering={hasSwitchedTabRef.current ? tabEnterAnim.duration(240) : undefined}
        exiting={tabExitAnim.duration(240)}
        style={{ flex: 1 }}
      >
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
      </Animated.View>

      {!searchActive && filteredCustomers.length > 0 && (
        <PressableScale
          containerStyle={styles.fabContainer}
          style={styles.fab}
          onPress={() => router.push("/add-entry")}
        >
          <Text style={styles.fabText}>{t.addUdhar}</Text>
        </PressableScale>
      )}

      {!searchActive && (
        <BottomTabBar
          active={listMode}
          onSelectHome={() => router.back()}
          onSelectPending={() => {
            hasSwitchedTabRef.current = true;
            setListMode("pending");
            router.setParams({ mode: "pending" });
          }}
          onSelectSettled={() => {
            hasSwitchedTabRef.current = true;
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
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF1F2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.15)",
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: { fontSize: 20 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.danger,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 12,
    color: "#E11D48",
    opacity: 0.85,
    marginTop: 2,
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 18,
  },
});

// ── Overdue modal styles ──────────────────────────────────────────────────────
const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.4,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: "#FFF1F2" },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFE4E6",
    borderWidth: 1.5,
    borderColor: "#FECDD3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.danger,
  },

  rowInfo: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rowOverdue: { fontSize: 12, color: colors.danger, marginTop: 2 },

  rowRight: { alignItems: "flex-end", gap: 2 },
  rowAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.3,
  },
  rowArrow: { fontSize: 18, color: colors.textTertiary, fontWeight: "600" },

  closeBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});

// ── Due Today styles ──────────────────────────────────────────────────────────
const due = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.18)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  headerIcon: { fontSize: 16 },
  headerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.amber,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    flex: 1,
  },
  badge: {
    backgroundColor: colors.amber,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.white },

  scroll: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },

  card: {
    alignItems: "center",
    backgroundColor: colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
    minWidth: 92,
  },

  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 18, fontWeight: "800", color: colors.white },
  customerName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    maxWidth: 86,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  amount: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.2,
  },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  searchIconBtnPressed: { backgroundColor: colors.primaryLight },

  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    gap: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textTertiary,
  },
  cancelBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelBtnPressed: { backgroundColor: colors.surface },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.2,
  },

  resultsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  resultsBadgeText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primary,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexShrink: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    letterSpacing: -0.2,
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
    letterSpacing: -0.3,
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },

  fabContainer: {
    position: "absolute",
    bottom: 92,
    alignSelf: "center",
    zIndex: 10,
  },
  fab: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  fabText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
