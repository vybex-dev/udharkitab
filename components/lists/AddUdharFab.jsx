/**
 * components/lists/AddUdharFab.jsx
 * Floating "+ Add Udhar" button shown at the bottom of the Pending and
 * Settled lists whenever there's at least one row to show.
 *
 * Positioning: this used to sit at a hardcoded `bottom: 92`, but
 * BottomTabBar's actual on-screen height is BAR_HEIGHT *plus* each
 * device's own bottom safe-area inset (the home-indicator / gesture-bar
 * strip) — that inset ranges from 0 on older 3-button Android phones to
 * 30+ on notched iPhones. A fixed number can only ever be right for one
 * of those, which is why the button visibly floated at different heights
 * (or crept up/down) across devices. Anchoring to the same
 * BAR_HEIGHT + insets.bottom math the tab bar itself uses keeps a
 * consistent, small gap above the bar on every device.
 */

import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PressableScale from "../PressableScale";
import { BAR_HEIGHT } from "../BottomTabBar";
import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";

// Small gap between the top of the tab bar and the bottom of this button —
// keep it snug ("a bit above the footer") rather than floating far above it.
const GAP_ABOVE_TAB_BAR = 14;

// Rough on-screen height of the pill button itself (vertical padding +
// text line height), used below so list screens can reserve enough
// scroll space that their last row never ends up hidden behind this.
const FAB_APPROX_HEIGHT = 50;

/**
 * How much bottom padding a scrollable list needs so its last row clears
 * both this floating button and the tab bar underneath it. Pass the same
 * `insets` from useSafeAreaInsets() that the screen already has.
 */
export function getFabListClearance(insets) {
  const tabBarHeight = BAR_HEIGHT + (insets.bottom || 10);
  return tabBarHeight + GAP_ABOVE_TAB_BAR + FAB_APPROX_HEIGHT + 16;
}

export default function AddUdharFab({ visible }) {
  const router = useRouter();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  // Mirrors BottomTabBar's own `bottomPad = insets.bottom || 10` fallback,
  // so this always sits the same visual distance above the real bar,
  // regardless of the device's safe-area inset.
  const tabBarHeight = BAR_HEIGHT + (insets.bottom || 10);

  return (
    <PressableScale
      containerStyle={[
        styles.fabContainer,
        { bottom: tabBarHeight + GAP_ABOVE_TAB_BAR },
      ]}
      style={styles.fab}
      onPress={() => router.push("/add-entry")}
    >
      <Text style={styles.fabText}>{t.addUdhar}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
  },
  fab: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  fabText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
