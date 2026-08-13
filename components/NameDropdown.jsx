/**
 * components/NameDropdown.jsx
 *
 * Live-search dropdown backed by SQLite.
 *
 * New behaviour:
 *  - Shows existing customers with their phone numbers for easy identification
 *  - When the typed name exactly matches one or more existing customers,
 *    appends an "➕ Add another [name]" row at the bottom of the list
 *  - Selecting that row closes the dropdown and calls onDuplicateNew(name)
 *    so the parent can make the phone field compulsory
 */

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import AvatarCircle from "./AvatarCircle";
import { searchCustomers, getCustomersByExactName } from "../lib/db";
import { useLanguage } from "../contexts/LanguageContext";
import { colors } from "../constants/colors";

export default function NameDropdown({
  value,
  onChange,
  onSelectCustomer,
  onDuplicateNew,   // called with (name) when user taps "Add another [name]"
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [hasDuplicate, setHasDuplicate] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setQuery("");
      setResults([]);
      setHasDuplicate(false);
      setOpen(false);
    }
  }, [value]);

  async function handleChange(text) {
    setQuery(text);
    onChange(text);
    onSelectCustomer(null);
    if (onDuplicateNew) onDuplicateNew(false); // reset duplicate mode

    clearTimeout(debounceRef.current);
    if (text.trim().length === 0) {
      setResults([]);
      setHasDuplicate(false);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const [rows, exactMatches] = await Promise.all([
          searchCustomers(text.trim()),
          getCustomersByExactName(text.trim()),
        ]);
        setResults(rows);
        setHasDuplicate(exactMatches.length > 0);
        setOpen(true);
      } catch (e) {
        console.error("NameDropdown search error:", e);
      }
    }, 150);
  }

  function handleSelect(customer) {
    setQuery(customer.name);
    onChange(customer.name);
    onSelectCustomer(customer.id, customer.phone || "");
    if (onDuplicateNew) onDuplicateNew(false);
    setOpen(false);
    Keyboard.dismiss();
  }

  function handleAddAnother() {
    // Keep the name, clear customer ID, signal duplicate mode to parent
    onSelectCustomer(null);
    if (onDuplicateNew) onDuplicateNew(true);
    setOpen(false);
    Keyboard.dismiss();
  }

  const exactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase(),
  );
  // Show "new customer" hint only if name doesn't match anyone
  const showNewHint = query.trim().length > 0 && !exactMatch;
  const showAddAnother = hasDuplicate && query.trim().length > 0;
  const hasDropdownContent = results.length > 0 || showNewHint || showAddAnother;

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder={t.customerName}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="next"
        onFocus={() => query.trim().length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />

      {open && hasDropdownContent && (
        <View style={styles.dropdown}>
          {/* Existing customer matches */}
          {results.map((customer) => (
            <Pressable
              key={customer.id}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => handleSelect(customer)}
            >
              <AvatarCircle name={customer.name} size={32} />
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{customer.name}</Text>
                {customer.phone ? (
                  <Text style={styles.itemPhone}>📞 {customer.phone}</Text>
                ) : (
                  <Text style={styles.itemNoPhone}>{t.noPhone}</Text>
                )}
              </View>
              <Text style={styles.selectHint}>{t.selectHint}</Text>
            </Pressable>
          ))}

          {/* "Add another [name]" — shown when exact match exists */}
          {showAddAnother && (
            <Pressable
              style={({ pressed }) => [
                styles.addAnotherRow,
                pressed && styles.itemPressed,
              ]}
              onPress={handleAddAnother}
            >
              <View style={styles.addAnotherIcon}>
                <Text style={styles.addAnotherIconText}>➕</Text>
              </View>
              <View style={styles.itemText}>
                <Text style={styles.addAnotherTitle}>
                  {t.addAnotherPerson(query.trim())}
                </Text>
                <Text style={styles.addAnotherSub}>{t.phoneWillBeRequired}</Text>
              </View>
            </Pressable>
          )}

          {/* "New customer will be created" hint */}
          {showNewHint && (
            <View style={styles.newHint}>
              <Text style={styles.newHintText}>
                ✨ "{query.trim()}" — {t.newCustomer}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 100 },
  input: {
    height: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },

  // ── Dropdown ──
  dropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  // ── Existing customer row ──
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemPressed: { backgroundColor: colors.surface },
  itemText: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  itemPhone: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  itemNoPhone: { fontSize: 12, color: colors.textTertiary, marginTop: 1, fontStyle: "italic" },
  selectHint: { fontSize: 11, color: colors.textTertiary },

  // ── "Add another" row ──
  addAnotherRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryLight,
  },
  addAnotherIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addAnotherIconText: { fontSize: 14 },
  addAnotherTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  addAnotherSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ── New customer hint ──
  newHint: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight,
  },
  newHintText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
});
