/**
 * app/privacy-policy.jsx
 * Renders the full UdharKitab Privacy Policy natively in-app.
 *
 * Two layers, because nobody reads 13 sections of legal text top to
 * bottom on a phone:
 *  1. A plain-language TL;DR card — always visible, 6 lines, covers what
 *     most people actually want to know.
 *  2. The full text, broken into collapsible sections (accordion) so the
 *     screen reads as a scannable list of topics, not a scroll of gray text.
 *
 * This exists so every "Privacy Policy" link in the app (Settings,
 * onboarding consent step, paywall footer, etc.) can router.push() here
 * instead of Linking.openURL()-ing out to a browser. Content lives in
 * constants/privacyPolicyContent.js, kept separate from this renderer so
 * updating the policy text never means touching layout code.
 */

import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";
import { PRIVACY_POLICY_URL } from "../constants/links";
import {
  privacyPolicySections,
  privacyPolicySectionIcons,
  privacyPolicyTldr,
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
              <View style={styles.bulletDot} />
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
              <Text style={styles.bulletNum}>{i + 1}</Text>
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
                <Text style={styles.dataCardMetaKey}>When  </Text>
                {row.when}
              </Text>
              <Text style={styles.dataCardMeta}>
                <Text style={styles.dataCardMetaKey}>Why  </Text>
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
                <Text style={styles.dataCardMetaKey}>Purpose  </Text>
                {row.purpose}
              </Text>
              <Text style={styles.dataCardMeta}>
                <Text style={styles.dataCardMetaKey}>Data  </Text>
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

function AccordionItem({ section, icon, expanded, onToggle }) {
  return (
    <View style={styles.accItem}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.accHeader,
          pressed && styles.accHeaderPressed,
        ]}
      >
        <View style={styles.accIconChip}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={styles.accTitle}>{section.title}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textTertiary}
        />
      </Pressable>

      {expanded && (
        <Animated.View entering={FadeIn.duration(160)} style={styles.accBody}>
          {section.blocks.map((block, j) => (
            <Block key={j} block={block} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(() => new Set());

  function toggle(i) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const allOpen = expanded.size === privacyPolicySections.length;
  function toggleAll() {
    setExpanded(
      allOpen
        ? new Set()
        : new Set(privacyPolicySections.map((_, i) => i)),
    );
  }

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
        <Text style={styles.meta}>
          Last updated {PRIVACY_POLICY_LAST_UPDATED} · Effective{" "}
          {PRIVACY_POLICY_EFFECTIVE_DATE}
        </Text>

        {/* TL;DR — the part people actually read */}
        <View style={styles.tldrCard}>
          <Text style={styles.tldrTitle}>The short version</Text>
          {privacyPolicyTldr.map((item, i) => (
            <View key={i} style={styles.tldrRow}>
              <View style={styles.tldrIconChip}>
                <Ionicons name={item.icon} size={15} color={colors.primary} />
              </View>
              <Text style={styles.tldrText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Full text — collapsible so the screen is scannable */}
        <View style={styles.fullTextHeader}>
          <Text style={styles.fullTextLabel}>Full policy</Text>
          <Pressable onPress={toggleAll} hitSlop={8}>
            <Text style={styles.toggleAllText}>
              {allOpen ? "Collapse all" : "Expand all"}
            </Text>
          </Pressable>
        </View>

        {privacyPolicySections.map((section, i) => (
          <AccordionItem
            key={i}
            section={section}
            icon={privacyPolicySectionIcons[i]}
            expanded={expanded.has(i)}
            onToggle={() => toggle(i)}
          />
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
    marginBottom: 4,
  },
  meta: { fontSize: 12, color: colors.textTertiary, fontWeight: "500", marginBottom: 18 },

  // TL;DR card
  tldrCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 26,
  },
  tldrTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tldrRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tldrIconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tldrText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "500",
    color: colors.textPrimary,
  },

  fullTextHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fullTextLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  toggleAllText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  // Accordion
  accItem: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  accHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  accHeaderPressed: { backgroundColor: colors.surface },
  accIconChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  accTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  accBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  h4: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  p: {
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: "400",
    color: colors.textSecondary,
    marginTop: 10,
  },

  list: { marginTop: 10, gap: 9 },
  listRow: { flexDirection: "row", gap: 9, alignItems: "flex-start" },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  bulletNum: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.primary,
    lineHeight: 20,
    minWidth: 16,
  },
  listText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.textSecondary,
  },

  cardGroup: { gap: 8, marginTop: 10 },
  dataCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  dataCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dataCardMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  dataCardMetaKey: { fontWeight: "700", color: colors.textTertiary },

  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 10,
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
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  contactValue: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
  contactValueLink: {
    fontSize: 13.5,
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  webCopy: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: 16,
    textDecorationLine: "underline",
  },
});
