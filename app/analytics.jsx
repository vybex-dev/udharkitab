/**
 * app/analytics.jsx
 * Business analytics — snapshot totals, week/month trends, monthly
 * history, top debtors, and overdue customers. Numbers and lists only,
 * no charts.
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

import { useAnalytics } from "../hooks/useAnalytics";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

import SnapshotCard from "../components/analytics/SnapshotCard";
import PeriodComparisonCard from "../components/analytics/PeriodComparisonCard";
import MonthlyHistoryList from "../components/analytics/MonthlyHistoryList";
import TopDebtorsList from "../components/analytics/TopDebtorsList";
import OverdueList from "../components/analytics/OverdueList";

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    snapshot,
    weekComparison,
    monthComparison,
    monthlyHistory,
    topDebtors,
    overdueList,
    loading,
    refreshing,
    refresh,
  } = useAnalytics();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.analyticsTitle || "Analytics"}</Text>
        <View style={{ width: 40 }} />
      </View>

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
          <SnapshotCard snapshot={snapshot} />

          <PeriodComparisonCard
            title={t.thisWeekVsLast || "This Week vs Last Week"}
            comparison={weekComparison}
          />
          <PeriodComparisonCard
            title={t.thisMonthVsLast || "This Month vs Last Month"}
            comparison={monthComparison}
          />

          <MonthlyHistoryList months={monthlyHistory} />
          <TopDebtorsList debtors={topDebtors} />
          <OverdueList overdue={overdueList} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: { fontSize: 15, color: colors.primary, fontWeight: "700" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  content: { gap: 12, paddingBottom: 40, paddingTop: 4 },
});
