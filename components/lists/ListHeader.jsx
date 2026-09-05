/**
 * components/lists/ListHeader.jsx
 * Top header for a customer-list screen (Pending / Settled): the
 * screen title + search icon, which swaps in place for a search input
 * row once search is active. Shared so both screens look and behave
 * identically.
 */

import { View, Text, Pressable, TextInput, Keyboard, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors } from "../../constants/colors";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ListHeader({
  title,
  searchActive,
  searchQuery,
  onChangeSearch,
  onOpenSearch,
  onCloseSearch,
}) {
  const { t } = useLanguage();

  if (searchActive) {
    return (
      <Animated.View entering={FadeInDown.duration(220)} style={styles.searchBarWrap}>
        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onChangeSearch}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="words"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onChangeSearch("")}
              hitSlop={10}
              style={styles.clearBtn}
            >
              <Ionicons name="close" size={13} color={colors.white} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={onCloseSearch}
          hitSlop={12}
          style={({ pressed }) => [
            styles.cancelBtn,
            pressed && styles.cancelBtnPressed,
          ]}
        >
          <Text style={styles.cancelText}>{t.searchCancel}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>{title}</Text>
      <View style={styles.headerIcons}>
        <Pressable
          onPress={onOpenSearch}
          hitSlop={8}
          style={({ pressed }) => [
            styles.searchIconBtn,
            pressed && styles.searchIconBtnPressed,
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  searchIconBtnPressed: { backgroundColor: colors.primaryLight },

  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    gap: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textTertiary,
  },
  cancelBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelBtnPressed: { backgroundColor: colors.surface },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.2,
  },
});
