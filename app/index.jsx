/**
 * app/index.jsx
 * Home screen — analytics-style overview rather than a customer list.
 * Reached via the bottom tab bar's "Home" button; Pending/Settled tabs
 * go to app/pending.jsx instead.
 *
 * Every number here comes from lib/analyticsDb.js / lib/db.js — nothing
 * is fabricated. Two things deliberately do NOT appear because there's
 * no real data behind them yet: a savings-style "Target Collection"
 * goal (no goal-setting feature exists) and a made-up health score
 * (replaced below with an honestly-labelled "Collection Rate").
 */

import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomTabBar from "../components/BottomTabBar";
import WeeklyFlowChart from "../components/analytics/WeeklyFlowChart";
import AvatarCircle from "../components/AvatarCircle";

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

  const collectionRatePct = Math.round((monthComparison.currentRate || 0) * 100);

  const monthChangePct =
    monthComparison.previousCollected > 0
      ? Math.round(
          ((monthComparison.currentCollected - monthComparison.previousCollected) /
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
            <Text style={styles.eyebrow}>
              {t.namaste || "NAMASTE"}
            </Text>
            <Text style={styles.shopName} numberOfLines={1}>
              {shopName || "UdharKitab"}
            </Text>
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
            <Pressable onPress={() => router.push("/pending")} hitSlop={8}>
              <Text style={styles.seeAll}>{t.seeAll || "See all"}</Text>
            </Pressable>
          </View>

          {topDebtors.length === 0 ? (
            <Text style={styles.emptyInline}>
              {t.noPendingCustomers || "No pending customers right now."}
            </Text>
          ) : (
            topDebtors.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.customerRow,
                  pressed && styles.customerRowPressed,
                ]}
                onPress={() => router.push(`/customer/${c.id}`)}
              >
                <AvatarCircle name={c.name} size={40} />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {c.name}
                  </Text>
                </View>
                <Text style={styles.customerAmount}>
                  {formatRupees(c.pending)}
                </Text>
              </Pressable>
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
                    <Pressable
                      style={styles.reminderBtn}
                      onPress={() => router.push(`/customer/${c.id}`)}
                    >
                      <Text style={styles.reminderBtnText}>
                        {t.sendReminder || "Send Reminder"}
                      </Text>
                    </Pressable>
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
                  <View key={c.id} style={[styles.dueCard, styles.dueCardUrgent]}>
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
                    <Pressable
                      style={styles.reminderBtn}
                      onPress={() => router.push(`/customer/${c.id}`)}
                    >
                      <Text style={styles.reminderBtnText}>
                        {t.sendReminder || "Send Reminder"}
                      </Text>
                    </Pressable>
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
        onSelectPending={() => router.push("/pending?mode=pending")}
        onSelectSettled={() => router.push("/pending?mode=settled")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },

  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  shopName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },

  collectionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
  },
  collectionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    opacity: 0.85,
    letterSpacing: 0.5,
  },
  changePill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  changePillNegative: { backgroundColor: "rgba(0,0,0,0.18)" },
  changePillText: { fontSize: 11, fontWeight: "800", color: colors.white },
  collectionAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
    marginTop: 6,
  },
  collectionBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  collectionBadge: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  collectionBadgeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.white,
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  collectionBadgeValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
    marginTop: 3,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },

  healthCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  healthTopRow: { flexDirection: "row", alignItems: "center" },
  healthEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
  },
  healthMainRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 6,
  },
  healthScore: { fontSize: 34, fontWeight: "800", color: colors.textPrimary },
  healthScoreUnit: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textTertiary,
    marginLeft: 2,
    marginBottom: 5,
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  healthSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 17,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  seeAll: { fontSize: 13, fontWeight: "700", color: colors.primary },
  emptyInline: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  customerRowPressed: { backgroundColor: colors.surface },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  customerAmount: { fontSize: 14, fontWeight: "800", color: colors.danger },

  dueScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  dueCard: {
    width: 170,
    borderRadius: 16,
    padding: 14,
    marginRight: 4,
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dueCardUrgent: { borderLeftColor: colors.danger },
  dueCardSoon: { borderLeftColor: colors.amber },
  urgentBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  urgentBadgeText: { fontSize: 9, fontWeight: "800", color: colors.danger },
  dueName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  dueAmount: { fontSize: 16, fontWeight: "800", color: colors.danger },
  dueDate: { fontSize: 11, color: colors.textSecondary },
  reminderBtn: {
    marginTop: 8,
    backgroundColor: "#181A20",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  reminderBtnText: { fontSize: 12, fontWeight: "700", color: colors.white },
});
