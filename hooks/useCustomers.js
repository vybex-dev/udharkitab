/**
 * hooks/useCustomers.js
 * Fetches customer list, home stats, and due-today list.
 */

import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  getCustomersWithPending,
  getHomeStats,
  getCustomersDueToday,
} from "../lib/db";
import { useLanguage } from "../contexts/LanguageContext";

export function useCustomers(initialSort = "highest") {
  const { t } = useLanguage();
  const [sort, setSort]           = useState(initialSort);
  const [customers, setCustomers] = useState([]);
  const [dueToday, setDueToday]   = useState([]);
  const [stats, setStats]         = useState({
    totalPending: 0,
    todayReceived: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [sort]),
  );

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [list, homeStats, todayList] = await Promise.all([
        getCustomersWithPending(sort),
        getHomeStats(),
        getCustomersDueToday(),
      ]);
      setCustomers(list);
      setStats(homeStats);
      setDueToday(todayList);
    } catch (e) {
      console.error("useCustomers loadData error:", e);
      setError(e.message ?? t.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function refresh() { loadData(true); }

  function changeSort(newSort) { setSort(newSort); }

  return {
    customers,
    dueToday,
    stats,
    loading,
    refreshing,
    error,
    sort,
    setSort: changeSort,
    refresh,
  };
}
