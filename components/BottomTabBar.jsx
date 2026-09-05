/**
 * components/BottomTabBar.jsx
 * Custom footer/tab bar, rendered from app/index.jsx (Home),
 * app/pending.jsx (Pending), and app/settled.jsx (Settled).
 *
 * Items: Home | Pending | (+ Add Udhar) | Settled | Settings
 *
 * "Home" navigates to "/". "Pending"/"Settled" are two separate
 * routes ("/pending" and "/settled") — each screen passes in its own
 * onSelectPending/onSelectSettled: a no-op for the tab that's already
 * active, and router.replace(...) for the other one, so switching
 * tabs slides to the other screen without piling up the back stack.
 * "+" opens the add-entry modal, raised above the bar.
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

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "./PressableScale";
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
          <PressableScale
            style={styles.addButton}
            onPress={() => router.push("/add-entry")}
            activeScale={0.93}
            hitSlop={8}
          >
            <Ionicons name="add" size={30} color={colors.white} />
          </PressableScale>
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
    <PressableScale
      containerStyle={styles.tabContainer}
      style={styles.tab}
      onPress={tab.onPress}
      activeScale={0.9}
      hitSlop={6}
    >
      <Ionicons
        name={active ? tab.iconActive : tab.icon}
        size={23}
        color={active ? colors.primary : "#8E8E93"}
      />
      <Text
        style={[styles.tabLabel, active && styles.tabLabelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {tab.label}
      </Text>
    </PressableScale>
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
    paddingTop: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderTopLeftRadius: TOP_CORNER_RADIUS,
    borderTopRightRadius: TOP_CORNER_RADIUS,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  tabContainer: {
    flex: 1,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#8E8E93",
    letterSpacing: -0.1,
    lineHeight: 14,
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "600",
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
