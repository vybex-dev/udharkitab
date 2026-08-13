/**
 * hooks/useSettledCustomers.js
 * Fetches the list of fully-settled customers for the Home screen's
 * "Settled" tab. Kept separate from useCustomers.js so the existing
 * pending-list behavior is never at risk of being disturbed.
 */

import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { getSettledCustomers } from "../lib/db";
import { useLanguage } from "../contexts/LanguageContext";

export function useSettledCustomers(initialSort = "recent", enabled = true) {
  const { t } = useLanguage();
  const [sort, setSort] = useState(initialSort);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (enabled) loadData(false);
    }, [sort, enabled]),
  );

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const list = await getSettledCustomers(sort);
      setCustomers(list);
    } catch (e) {
      console.error("useSettledCustomers loadData error:", e);
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function refresh() {
    loadData(true);
  }

  function changeSort(newSort) {
    setSort(newSort);
  }

  return {
    customers,
    loading,
    refreshing,
    error,
    sort,
    setSort: changeSort,
    refresh,
  };
}
