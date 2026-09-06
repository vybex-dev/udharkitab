/**
 * app/index.jsx
 * Home screen — analytics-style overview rather than a customer list.
 * Reached via the bottom tab bar's "Home" button; the Pending/Settled
 * tabs go to app/pending.jsx and app/settled.jsx instead.
 *
 * Every number here comes from lib/analyticsDb.js / lib/db.js — nothing
 * is fabricated. Two things deliberately do NOT appear because there's
 * no real data behind them yet: a savings-style "Target Collection"
 * goal (no goal-setting feature exists) and a made-up health score
 * (replaced below with an honestly-labelled "Collection Rate").
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import BottomTabBar from "../components/BottomTabBar";
import WeeklyFlowChart from "../components/analytics/WeeklyFlowChart";
import AvatarCircle from "../components/AvatarCircle";
import PressableScale from "../components/PressableScale";

import { useHomeAnalytics } from "../hooks/useHomeAnalytics";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { formatRupees, relativeLabel } from "../lib/date";

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const {
    shopName,
    snapshot,
    monthComparison,
    weeklyFlow,
    topDebtors,
    overdueList,
    dueToday,
    loading,
    refreshing,
    refresh,
  } = useHomeAnalytics();

  const [notifVisible, setNotifVisible] = useState(false);

  // Counts come straight from the same overdue/due-today data already
  // loaded for the cards below — nothing fabricated for the badge.
  const notifCount = (overdueList?.length || 0) + (dueToday?.length || 0);
  const notifBadgeLabel = notifCount > 9 ? "9+" : String(notifCount);

  const collectionRatePct = Math.round(
    (monthComparison.currentRate || 0) * 100,
  );

  const monthChangePct =
    monthComparison.previousCollected > 0
      ? Math.round(
          ((monthComparison.currentCollected -
            monthComparison.previousCollected) /
            monthComparison.previousCollected) *
            100,
        )
      : null; // no previous-month data to compare against

  // Two separate sections now, no merging: today's due list as-is, and
  // the overdue list as-is — capped so each card row doesn't run long.
  const dueTodayCards = dueToday.slice(0, 6);
  const overdueCards = overdueList.slice(0, 6);

  function healthLabel(pct) {
    if (pct >= 80) return t.healthExcellent || "Excellent";
    if (pct >= 60) return t.healthGood || "Good";
    if (pct >= 40) return t.healthFair || "Fair";
    return t.healthNeedsAttention || "Needs attention";
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 60 }}
          size="large"
          color={colors.primary}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.headerBlock}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextCol}>
                <Text style={styles.eyebrow}>{t.namaste || "NAMASTE"}</Text>
                <Text style={styles.shopName} numberOfLines={1}>
                  {shopName || "UdharKitab"}
                </Text>
              </View>

              <PressableScale
                style={styles.bellButton}
                onPress={() => setNotifVisible(true)}
                hitSlop={10}
                activeScale={0.9}
                accessibilityRole="button"
                accessibilityLabel={t.notifications || "Notifications"}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.textPrimary}
                />
                {notifCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{notifBadgeLabel}</Text>
                  </View>
                )}
              </PressableScale>
            </View>
          </View>

          {/* Total Collection card */}
          <View style={styles.collectionCard}>
            <View style={styles.collectionTopRow}>
              <Text style={styles.collectionLabel}>
                {t.totalCollectionMonth || "TOTAL COLLECTION · THIS MONTH"}
              </Text>
              {monthChangePct !== null && (
                <View
                  style={[
                    styles.changePill,
                    monthChangePct < 0 && styles.changePillNegative,
                  ]}
                >
                  <Text style={styles.changePillText}>
                    {monthChangePct >= 0 ? "+" : ""}
                    {monthChangePct}%
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.collectionAmount}>
              {formatRupees(monthComparison.currentCollected)}
            </Text>

            <View style={styles.collectionBadgeRow}>
              <View style={styles.collectionBadge}>
                <Text style={styles.collectionBadgeLabel}>
                  {t.pendingUdharLabel || "PENDING UDHAR"}
                </Text>
                <Text style={styles.collectionBadgeValue}>
                  {formatRupees(snapshot.totalOutstanding)}
                </Text>
              </View>
              <View style={styles.collectionBadge}>
                <Text style={styles.collectionBadgeLabel}>
                  {t.collectionRateLabelHome || "COLLECTION RATE"}
                </Text>
                <Text style={styles.collectionBadgeValue}>
                  {collectionRatePct}%
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Flow */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t.weeklyFlow || "Weekly Flow"}
            </Text>
            <WeeklyFlowChart data={weeklyFlow} language={language} />
          </View>

          {/* Collection Rate (honest replacement for a fake health score) */}
          <View style={styles.healthCard}>
            <View style={styles.healthTopRow}>
              <Text style={styles.healthEyebrow}>
                {t.collectionHealth || "COLLECTION RATE THIS MONTH"}
              </Text>
            </View>
            <View style={styles.healthMainRow}>
              <Text style={styles.healthScore}>{collectionRatePct}</Text>
              <Text style={styles.healthScoreUnit}>%</Text>
            </View>
            <View style={styles.healthBadge}>
              <View style={styles.healthDot} />
              <Text style={styles.healthBadgeText}>
                {healthLabel(collectionRatePct)}
              </Text>
            </View>
            <Text style={styles.healthSub}>
              {typeof t.collectionHealthSub === "function"
                ? t.collectionHealthSub(
                    formatRupees(monthComparison.currentCollected),
                    formatRupees(monthComparison.currentGiven),
                  )
                : `${formatRupees(monthComparison.currentCollected)} collected of ${formatRupees(monthComparison.currentGiven)} given out this month.`}
            </Text>
          </View>

          {/* Top Customers */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t.topCustomers || "Top Customers"}
            </Text>
            <PressableScale
              onPress={() => router.push("/pending")}
              hitSlop={8}
              activeScale={0.96}
            >
              <Text style={styles.seeAll}>{t.seeAll || "See all"}</Text>
            </PressableScale>
          </View>

          {topDebtors.length === 0 ? (
            <Text style={styles.emptyInline}>
              {t.noPendingCustomers || "No pending customers right now."}
            </Text>
          ) : (
            topDebtors.map((c) => (
              <PressableScale
                key={c.id}
                style={styles.customerRow}
                onPress={() => router.push(`/customer/${c.id}`)}
                activeScale={0.98}
              >
                <AvatarCircle name={c.name} size={42} />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {c.name}
                  </Text>
                </View>
                <Text style={styles.customerAmount}>
                  {formatRupees(c.pending)}
                </Text>
              </PressableScale>
            ))
          )}

          {/* Due Today */}
          {dueTodayCards.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t.dueToday || "Due Today"}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dueScroll}
              >
                {dueTodayCards.map((c) => (
                  <View key={c.id} style={[styles.dueCard, styles.dueCardSoon]}>
                    <Text style={styles.dueName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.dueAmount}>
                      {formatRupees(c.pending)}
                    </Text>
                    <Text style={styles.dueDate}>
                      {t.dueTodayLabel || "Due today"}
                    </Text>
                    <PressableScale
                      style={styles.reminderBtn}
                      onPress={() => router.push(`/customer/${c.id}`)}
                      activeScale={0.95}
                    >
                      <Text style={styles.reminderBtnText}>
                        {t.sendReminder || "Send Reminder"}
                      </Text>
                    </PressableScale>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* Overdue */}
          {overdueCards.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t.overdue || "Overdue"}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dueScroll}
              >
                {overdueCards.map((c) => (
                  <View
                    key={c.id}
                    style={[styles.dueCard, styles.dueCardUrgent]}
                  >
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>
                        {t.urgent || "URGENT"}
                      </Text>
                    </View>
                    <Text style={styles.dueName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.dueAmount}>
                      {formatRupees(c.pending)}
                    </Text>
                    <Text style={styles.dueDate}>
                      {c.oldest_due_date
                        ? `${t.due || "Due"}: ${relativeLabel(c.oldest_due_date, language)}`
                        : t.overdueLabel || "Overdue"}
                    </Text>
                    <PressableScale
                      style={styles.reminderBtn}
                      onPress={() => router.push(`/customer/${c.id}`)}
                      activeScale={0.95}
                    >
                      <Text style={styles.reminderBtnText}>
                        {t.sendReminder || "Send Reminder"}
                      </Text>
                    </PressableScale>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </ScrollView>
      )}

      <BottomTabBar
        active="home"
        onSelectHome={() => {}}
        onSelectPending={() => router.push("/pending")}
        onSelectSettled={() => router.push("/settled")}
      />

      <Modal
        visible={notifVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifVisible(false)}
      >
        <Pressable
          style={styles.notifBackdrop}
          onPress={() => setNotifVisible(false)}
        />
        <View style={styles.notifSheet}>
          <View style={styles.notifHandle} />
          <View style={styles.notifHeaderRow}>
            <Text style={styles.notifTitle}>
              {t.notifications || "Notifications"}
            </Text>
            <PressableScale
              onPress={() => setNotifVisible(false)}
              hitSlop={10}
              activeScale={0.9}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </PressableScale>
          </View>

          <ScrollView
            style={styles.notifList}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {notifCount === 0 ? (
              <Text style={styles.notifEmpty}>
                {t.notificationsEmpty ||
                  "You're all caught up — no pending reminders."}
              </Text>
            ) : (
              <>
                {overdueCards.length > 0 && (
                  <>
                    <Text style={styles.notifSectionLabel}>
                      {t.overdue || "Overdue"}
                    </Text>
                    {overdueCards.map((c) => (
                      <PressableScale
                        key={`notif-overdue-${c.id}`}
                        style={styles.notifRow}
                        onPress={() => {
                          setNotifVisible(false);
                          router.push(`/customer/${c.id}`);
                        }}
                        activeScale={0.98}
                      >
                        <View
                          style={[styles.notifDot, styles.notifDotDanger]}
                        />
                        <View style={styles.notifRowText}>
                          <Text style={styles.notifRowName} numberOfLines={1}>
                            {c.name}
                          </Text>
                          <Text style={styles.notifRowSub}>
                            {c.oldest_due_date
                              ? `${t.due || "Due"}: ${relativeLabel(c.oldest_due_date, language)}`
                              : t.overdueLabel || "Overdue"}
                          </Text>
                        </View>
                        <Text style={styles.notifRowAmount}>
                          {formatRupees(c.pending)}
                        </Text>
                      </PressableScale>
                    ))}
                  </>
                )}

                {dueTodayCards.length > 0 && (
                  <>
                    <Text style={styles.notifSectionLabel}>
                      {t.dueToday || "Due Today"}
                    </Text>
                    {dueTodayCards.map((c) => (
                      <PressableScale
                        key={`notif-due-${c.id}`}
                        style={styles.notifRow}
                        onPress={() => {
                          setNotifVisible(false);
                          router.push(`/customer/${c.id}`);
                        }}
                        activeScale={0.98}
                      >
                        <View style={[styles.notifDot, styles.notifDotAmber]} />
                        <View style={styles.notifRowText}>
                          <Text style={styles.notifRowName} numberOfLines={1}>
                            {c.name}
                          </Text>
                          <Text style={styles.notifRowSub}>
                            {t.dueTodayLabel || "Due today"}
                          </Text>
                        </View>
                        <Text style={styles.notifRowAmount}>
                          {formatRupees(c.pending)}
                        </Text>
                      </PressableScale>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 28 },

  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextCol: { flex: 1, paddingRight: 12 },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.white,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  shopName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginTop: 2,
  },

  collectionCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 6,
  },
  collectionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  changePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  changePillNegative: { backgroundColor: "rgba(0,0,0,0.22)" },
  changePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.2,
  },
  collectionAmount: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -1.2,
    marginTop: 8,
  },
  collectionBadgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  collectionBadge: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  collectionBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  collectionBadgeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.3,
    marginTop: 4,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 8,
  },

  healthCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  healthTopRow: { flexDirection: "row", alignItems: "center" },
  healthEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  healthMainRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 6,
  },
  healthScore: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  healthScoreUnit: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textTertiary,
    marginLeft: 3,
    marginBottom: 5,
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  healthSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  emptyInline: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  customerRowPressed: {
    backgroundColor: colors.surfaceHover || colors.surface,
  },
  customerInfo: { flex: 1 },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  customerAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.3,
  },

  dueScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  dueCard: {
    width: 176,
    borderRadius: 18,
    padding: 16,
    marginRight: 4,
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  dueCardUrgent: { borderLeftColor: colors.danger },
  dueCardSoon: { borderLeftColor: colors.amber },
  urgentBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 3,
  },
  urgentBadgeText: { fontSize: 10, fontWeight: "800", color: colors.danger },
  dueName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  dueAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.danger,
    letterSpacing: -0.3,
  },
  dueDate: { fontSize: 12, color: colors.textSecondary },
  reminderBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.2,
  },

  notifBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  notifSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "75%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  notifHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  notifList: { marginTop: 6 },
  notifEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 32,
  },
  notifSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 8,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 10,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifDotDanger: { backgroundColor: colors.danger },
  notifDotAmber: { backgroundColor: colors.amber },
  notifRowText: { flex: 1 },
  notifRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  notifRowSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  notifRowAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
});
