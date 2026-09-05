/**
 * app/privacy-policy.jsx
 * Renders the full UdharKitab Privacy Policy natively in-app.
 *
 * This exists so every "Privacy Policy" link in the app (Settings,
 * onboarding consent step, paywall footer, etc.) can router.push() here
 * instead of Linking.openURL()-ing out to a browser. Content lives in
 * constants/privacyPolicyContent.js, kept separate from this renderer so
 * updating the policy text never means touching layout code.
 */

import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { PRIVACY_POLICY_URL } from "../constants/links";
import {
  privacyPolicySections,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_EFFECTIVE_DATE,
} from "../constants/privacyPolicyContent";

function Block({ block }) {
  switch (block.type) {
    case "h4":
      return <Text style={styles.h4}>{block.text}</Text>;

    case "p":
      return <Text style={styles.p}>{block.text}</Text>;

    case "ul":
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.bullet}>{"\u2022"}</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "ol":
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.bulletNum}>{i + 1}.</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "dataTable":
      return (
        <View style={styles.cardGroup}>
          {block.rows.map((row, i) => (
            <View key={i} style={styles.dataCard}>
              <Text style={styles.dataCardLabel}>{row.label}</Text>
              <Text style={styles.dataCardMeta}>
                <Text style={styles.dataCardMetaKey}>When: </Text>
                {row.when}
              </Text>
              <Text style={styles.dataCardMeta}>
                <Text style={styles.dataCardMetaKey}>Why: </Text>
                {row.why}
              </Text>
            </View>
          ))}
        </View>
      );

    case "providerTable":
      return (
        <View style={styles.cardGroup}>
          {block.rows.map((row, i) => (
            <View key={i} style={styles.dataCard}>
              <Text style={styles.dataCardLabel}>{row.provider}</Text>
              <Text style={styles.dataCardMeta}>
                <Text style={styles.dataCardMetaKey}>Purpose: </Text>
                {row.purpose}
              </Text>
              <Text style={styles.dataCardMeta}>
                <Text style={styles.dataCardMetaKey}>Data: </Text>
                {row.data}
              </Text>
            </View>
          ))}
        </View>
      );

    case "contactCard":
      return (
        <View style={styles.contactCard}>
          {block.rows.map((row, i) => (
            <View
              key={i}
              style={[
                styles.contactRow,
                i === block.rows.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.contactLabel}>{row.label}</Text>
              {row.href ? (
                <Pressable onPress={() => Linking.openURL(row.href)} hitSlop={6}>
                  <Text style={styles.contactValueLink}>{row.value}</Text>
                </Pressable>
              ) : (
                <Text style={styles.contactValue}>{row.value}</Text>
              )}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {t.privacyPolicyLabel || "Privacy Policy"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.docTitle}>Privacy Policy — UdharKitab</Text>
        <Text style={styles.meta}>Last updated: {PRIVACY_POLICY_LAST_UPDATED}</Text>
        <Text style={styles.meta}>Effective date: {PRIVACY_POLICY_EFFECTIVE_DATE}</Text>

        <View style={styles.divider} />

        {privacyPolicySections.map((section, i) => (
          <View key={i} style={styles.section}>
            {section.title ? (
              <Text style={styles.h3}>{section.title}</Text>
            ) : null}
            {section.blocks.map((block, j) => (
              <Block key={j} block={block} />
            ))}
          </View>
        ))}

        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
          <Text style={styles.webCopy}>
            This policy is also available at {PRIVACY_POLICY_URL}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  scroll: { padding: 20, paddingBottom: 48 },

  docTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  meta: { fontSize: 12.5, color: colors.textTertiary, fontWeight: "600" },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  section: { marginBottom: 24 },
  h3: {
    fontSize: 15.5,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  h4: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  p: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  list: { marginBottom: 8, gap: 8 },
  listRow: { flexDirection: "row", gap: 8 },
  bullet: { fontSize: 14, color: colors.primary, lineHeight: 21 },
  bulletNum: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.primary,
    lineHeight: 21,
    minWidth: 16,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  cardGroup: { gap: 8, marginBottom: 8 },
  dataCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  dataCardLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dataCardMeta: { fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  dataCardMetaKey: { fontWeight: "700", color: colors.textPrimary },

  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  contactRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  contactLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  contactValue: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  contactValueLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  webCopy: {
    fontSize: 12.5,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: 12,
    textDecorationLine: "underline",
  },
});
