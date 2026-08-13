/**
 * components/EmptyState.jsx
 * Shown on Home when no customers have pending udhar.
 */

import { View, Text, Image, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function EmptyState() {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>{t.noUdhar}</Text>
      <Text style={styles.sub}>{t.noUdharSub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    gap: 8,
  },
  icon: { width: 72, height: 72, marginBottom: 8, borderRadius: 20 },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary },
});
