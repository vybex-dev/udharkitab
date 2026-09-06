/**
 * app/pending.jsx
 * Pending customers list screen. Reached via the bottom tab bar's
 * "Pending" button, or Home's "See all" link.
 *
 * This used to be one file that also rendered the Settled list behind
 * a ?mode= param, with a hand-rolled slide animation for switching
 * between the two. It's now split into two real routes — this one and
 * app/settled.jsx — so each stays focused, and switching tabs is a
 * normal navigation that gets the same slide transition as everywhere
 * else in the app (see app/_layout.jsx's Stack defaults).
 */

import {
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import StatBar from "../components/StatBar";
import CustomerRow from "../components/CustomerRow";
import EmptyState from "../components/EmptyState";
import BottomTabBar from "../components/BottomTabBar";
import ListHeader from "../components/lists/ListHeader";
import ResultsBadge from "../components/lists/ResultsBadge";
import SortPillRow from "../components/lists/SortPillRow";
import AddUdharFab from "../components/lists/AddUdharFab";
import NoSearchResults from "../components/lists/NoSearchResults";
import OverdueBanner from "../components/pending/OverdueBanner";
import OverdueModal from "../components/pending/OverdueModal";
import DueTodayStrip from "../components/pending/DueTodayStrip";

import { useCustomers } from "../hooks/useCustomers";
import { useCustomerListSearch } from "../hooks/useCustomerListSearch";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function PendingScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const {
    customers,
    dueToday,
    stats,
    loading,
    refreshing,
    sort,
    setSort,
    refresh,
  } = useCustomers();

  const {
    searchActive,
    searchQuery,
    setSearchQuery,
    filteredCustomers,
    openSearch,
    closeSearch,
  } = useCustomerListSearch(customers);

  const [overdueModalVisible, setOverdueModalVisible] = useState(false);

  const SORT_OPTIONS = [
    { key: "highest", label: t.filterHighest },
    { key: "recent", label: t.filterRecent },
    { key: "name", label: t.filterName },
  ];

  // Overdue customers derived from the list (overdue_count comes from db query)
  const overdueCustomers = useMemo(
    () => customers.filter((c) => c.overdue_count > 0),
    [customers],
  );

  function goToCustomer(id) {
    router.push(`/customer/${id}`);
  }

  function handleBannerPress() {
    if (overdueCustomers.length === 1) {
      goToCustomer(overdueCustomers[0].id);
    } else {
      setOverdueModalVisible(true);
    }
  }

  function renderHeader() {
    if (searchActive) return null;
    return (
      <>
        <OverdueBanner
          overdueCustomers={overdueCustomers}
          onPress={handleBannerPress}
        />
        <StatBar
          totalPending={stats.totalPending}
          todayReceived={stats.todayReceived}
        />
        <DueTodayStrip dueToday={dueToday} onSelectCustomer={goToCustomer} />
        <SortPillRow
          options={SORT_OPTIONS}
          activeSort={sort}
          onChange={setSort}
        />
      </>
    );
  }

  function ListEmpty() {
    if (loading) return null;
    if (searchQuery.trim()) {
      return <NoSearchResults query={searchQuery.trim()} />;
    }
    return <EmptyState />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ListHeader
        title={t.pendingTab}
        searchActive={searchActive}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        onOpenSearch={openSearch}
        onCloseSearch={closeSearch}
      />

      <ResultsBadge
        visible={searchActive && searchQuery.trim().length > 0}
        resultCount={filteredCustomers.length}
      />

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
          renderItem={({ item }) => <CustomerRow customer={item} />}
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

      {!searchActive && <AddUdharFab visible={filteredCustomers.length > 0} />}

      {!searchActive && (
        <BottomTabBar
          active="pending"
          onSelectHome={() => router.back()}
          onSelectPending={() => {}}
          onSelectSettled={() =>
            router.replace({ pathname: "/settled", params: { dir: "right" } })
          }
        />
      )}

      <OverdueModal
        visible={overdueModalVisible}
        onClose={() => setOverdueModalVisible(false)}
        overdueCustomers={overdueCustomers}
        onSelectCustomer={(id) => {
          setOverdueModalVisible(false);
          goToCustomer(id);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  emptyContent: { flexGrow: 1 },
});
