/**
 * hooks/useAnalytics.js
 * Fetches everything the Analytics screen needs in one place.
 */

import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  getSnapshotTotals,
  getPeriodComparison,
  getMonthlyHistory,
  getTopDebtors,
  getOverdueCustomersList,
} from "../lib/analyticsDb";
import { useLanguage } from "../contexts/LanguageContext";

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

export function useAnalytics() {
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [weekComparison, setWeekComparison] = useState(EMPTY_COMPARISON);
  const [monthComparison, setMonthComparison] = useState(EMPTY_COMPARISON);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, []),
  );

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [snap, week, month, history, debtors, overdue] =
        await Promise.all([
          getSnapshotTotals(),
          getPeriodComparison("week"),
          getPeriodComparison("month"),
          getMonthlyHistory(6),
          getTopDebtors(10),
          getOverdueCustomersList(),
        ]);
      setSnapshot(snap);
      setWeekComparison(week);
      setMonthComparison(month);
      setMonthlyHistory(history);
      setTopDebtors(debtors);
      setOverdueList(overdue);
    } catch (e) {
      console.error("useAnalytics loadData error:", e);
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function refresh() {
    loadData(true);
  }

  return {
    snapshot,
    weekComparison,
    monthComparison,
    monthlyHistory,
    topDebtors,
    overdueList,
    loading,
    refreshing,
    error,
    refresh,
  };
}
