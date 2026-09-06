/**
 * app/settled.jsx
 * Settled customers list screen. Reached via the bottom tab bar's
 * "Settled" button.
 *
 * Sibling of app/pending.jsx — the two used to be a single file that
 * switched on a ?mode= param. They're split so each stays focused, and
 * switching tabs is a normal navigation that gets the same slide
 * transition as everywhere else in the app (see app/_layout.jsx's
 * Stack defaults).
 */

import {
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import StatBar from "../components/StatBar";
import SettledCustomerRow from "../components/SettledCustomerRow";
import SettledEmptyState from "../components/SettledEmptyState";
import BottomTabBar from "../components/BottomTabBar";
import ListHeader from "../components/lists/ListHeader";
import ResultsBadge from "../components/lists/ResultsBadge";
import SortPillRow from "../components/lists/SortPillRow";
import AddUdharFab from "../components/lists/AddUdharFab";
import NoSearchResults from "../components/lists/NoSearchResults";

import { useSettledCustomers } from "../hooks/useSettledCustomers";
import { useCustomerListSearch } from "../hooks/useCustomerListSearch";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function SettledScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const { customers, stats, loading, refreshing, sort, setSort, refresh } =
    useSettledCustomers("recent");

  const {
    searchActive,
    searchQuery,
    setSearchQuery,
    filteredCustomers,
    openSearch,
    closeSearch,
  } = useCustomerListSearch(customers);

  const SORT_OPTIONS = [
    { key: "highest", label: t.filterHighest },
    { key: "recent", label: t.filterRecent },
    { key: "name", label: t.filterName },
  ];

  function renderHeader() {
    if (searchActive) return null;
    return (
      <>
        <StatBar
          totalPending={stats.totalReceived}
          todayReceived={stats.todayReceived}
          leftLabel={t.totalReceived}
          leftColor={colors.success}
        />
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
    return <SettledEmptyState />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ListHeader
        title={t.settledTab}
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
          renderItem={({ item }) => <SettledCustomerRow customer={item} />}
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
          active="settled"
          onSelectHome={() => router.back()}
          onSelectPending={() =>
            router.replace({ pathname: "/pending", params: { dir: "left" } })
          }
          onSelectSettled={() => {}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  emptyContent: { flexGrow: 1 },
});
