/**
 * components/lists/AddUdharFab.jsx
 * Floating "+ Add Udhar" button shown at the bottom of the Pending and
 * Settled lists whenever there's at least one row to show.
 */

import { Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import PressableScale from "../PressableScale";
import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AddUdharFab({ visible }) {
  const router = useRouter();
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <PressableScale
      containerStyle={styles.fabContainer}
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
    bottom: 92,
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
