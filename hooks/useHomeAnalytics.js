/**
 * hooks/useHomeAnalytics.js
 * Fetches everything the analytics-style Home screen needs, in one place.
 * Mirrors the pattern of hooks/useAnalytics.js but scoped to what Home
 * actually shows (a lighter subset, plus the weekly bar chart + due-today
 * list that the full Analytics screen doesn't need).
 */

import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  getSnapshotTotals,
  getPeriodComparison,
  getTopDebtors,
  getOverdueCustomersList,
  getWeeklyDailyBreakdown,
} from "../lib/analyticsDb";
import { getCustomersDueToday } from "../lib/db";
import { getLocalProfile } from "../lib/profile";

const EMPTY_SNAPSHOT = {
  totalOutstanding: 0,
  totalOverdue: 0,
  overdueCustomerCount: 0,
  totalCollectedAllTime: 0,
};

const EMPTY_COMPARISON = {
  currentGiven: 0,
  previousGiven: 0,
  currentCollected: 0,
  previousCollected: 0,
  currentRate: 0,
  previousRate: 0,
};

export function useHomeAnalytics() {
  const [shopName, setShopName] = useState("");
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [monthComparison, setMonthComparison] = useState(EMPTY_COMPARISON);
  const [weeklyFlow, setWeeklyFlow] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [dueToday, setDueToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [profile, snap, month, weekly, debtors, overdue, today] =
        await Promise.all([
          getLocalProfile(),
          getSnapshotTotals(),
          getPeriodComparison("month"),
          getWeeklyDailyBreakdown(7),
          getTopDebtors(5),
          getOverdueCustomersList(),
          getCustomersDueToday(),
        ]);
      setShopName(profile?.shopName || "");
      setSnapshot(snap);
      setMonthComparison(month);
      setWeeklyFlow(weekly);
      setTopDebtors(debtors);
      setOverdueList(overdue);
      setDueToday(today);
    } catch (e) {
      console.error("useHomeAnalytics loadData error:", e);
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData]),
  );

  function refresh() {
    loadData(true);
  }

  return {
    shopName,
    snapshot,
    monthComparison,
    weeklyFlow,
    topDebtors,
    overdueList,
    dueToday,
    loading,
    refreshing,
    error,
    refresh,
  };
}
