/**
 * components/BottomTabBar.jsx
 * Custom footer/tab bar, rendered from both app/index.jsx (Home) and
 * app/pending.jsx (Pending/Settled list).
 *
 * Items: Home | Pending | (+ Add Udhar) | Settled | Settings
 *
 * "Home" navigates to "/". "Pending"/"Settled" navigate to
 * "/pending?mode=pending|settled" (or just flip local state if already
 * on that screen). "+" opens the add-entry modal, raised above the bar.
 * The bar itself has rounded top-left/top-right corners (see
 * TOP_CORNER_RADIUS) for a soft, floating look.
 *
 * Usage:
 *   <BottomTabBar
 *     active="home" | "pending" | "settled"
 *     onSelectHome={...}
 *     onSelectPending={...}
 *     onSelectSettled={...}
 *   />
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { useLanguage } from "../contexts/LanguageContext";

const BAR_HEIGHT = 64; // height of the flat part of the bar
const TOP_CORNER_RADIUS = 28; // rounds just the top-left/top-right corners

export default function BottomTabBar({
  active = "pending", // "home" | "pending" | "settled"
  onSelectHome,
  onSelectPending,
  onSelectSettled,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom || 10;
  const { t } = useLanguage();

  const TABS = [
    {
      key: "home",
      label: t.homeTab || "Home",
      icon: "home-outline",
      iconActive: "home",
      onPress: onSelectHome,
    },
    {
      key: "pending",
      label: t.pendingTab || "Pending",
      icon: "time-outline",
      iconActive: "time",
      onPress: onSelectPending,
    },
    // "+" sits in the middle — rendered separately, not in this map
    {
      key: "settled",
      label: t.settledTab || "Settled",
      icon: "checkmark-circle-outline",
      iconActive: "checkmark-circle",
      onPress: onSelectSettled,
    },
    {
      key: "settings",
      label: t.settingsTitle || "Settings",
      icon: "settings-outline",
      iconActive: "settings",
      onPress: () => router.push("/settings"),
    },
  ];

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {leftTabs.map((tab) => (
          <TabItem key={tab.key} tab={tab} active={active === tab.key} />
        ))}

        {/* Center "+" button, floats above the bar */}
        <View style={styles.centerSlot}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => router.push("/add-entry")}
            hitSlop={8}
          >
            <Ionicons name="add" size={30} color={colors.white} />
          </Pressable>
        </View>

        {rightTabs.map((tab) => (
          <TabItem key={tab.key} tab={tab} active={active === tab.key} />
        ))}
      </View>
      {/* Safe-area strip below the curved bar, kept white so the two
          read as one continuous surface rather than a visible seam */}
      <View style={[styles.safeAreaFill, { height: bottomPad }]} />
    </View>
  );
}

function TabItem({ tab, active }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      onPress={tab.onPress}
      hitSlop={6}
    >
      <Ionicons
        name={active ? tab.iconActive : tab.icon}
        size={22}
        color={active ? colors.primary : colors.textTertiary}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: BAR_HEIGHT,
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderTopLeftRadius: TOP_CORNER_RADIUS,
    borderTopRightRadius: TOP_CORNER_RADIUS,
    // hairline separation only, no floating shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  tabPressed: { opacity: 0.6 },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },

  safeAreaFill: {
    backgroundColor: colors.white,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20, // sits snug against the bar, not floating far above it
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
