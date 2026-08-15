/**
 * components/NetworkErrorScreen.jsx
 * Full-screen takeover shown in place of a screen's normal content when
 * that screen needs the network (because cloud sync is on) but the
 * device is offline. Used by login.jsx (returning-user sign-in) and
 * settings.jsx (turning sync on).
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../constants/colors";
import { useLanguage } from "../contexts/LanguageContext";

export default function NetworkErrorScreen({ onRetry, retrying }) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
        </View>

        <Text style={styles.title}>{t.networkErrorTitle}</Text>
        <Text style={styles.subtitle}>{t.networkErrorSubtitle}</Text>

        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
          onPress={onRetry}
          disabled={retrying}
        >
          <Text style={styles.retryText}>
            {retrying ? t.networkErrorRetrying : t.networkErrorRetry}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  retryBtnPressed: { opacity: 0.85 },
  retryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
