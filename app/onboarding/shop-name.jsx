/**
 * app/onboarding/shop-name.jsx
 * Step 2 of onboarding — shop name.
 * Restyled input to match the mockup's icon-prefixed rounded field, kept
 * the ledger-header live preview card as a nice extra above it. Logic
 * unchanged.
 */

import { View, Text, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useLanguage } from "../../contexts/LanguageContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { theme } from "../../constants/theme";
import OnboardingStepShell from "../../components/onboarding/OnboardingStepShell";
import ApprovalStamp from "../../components/onboarding/ApprovalStamp";

export default function ShopNameScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { draft, updateDraft } = useOnboarding();
  const [name, setName] = useState(draft.shopName || "");
  const [error, setError] = useState("");

  function handleNext() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.nameRequired || "Enter your shop's name");
      return;
    }
    updateDraft({ shopName: trimmed });
    router.push("/onboarding/theme");
  }

  const trimmedName = name.trim();

  return (
    <OnboardingStepShell
      stepKey="shop-name"
      eyebrow="Your shop"
      title="What's your shop called?"
      subtitle="Let's personalize your digital khata."
      ctaLabel="Continue"
      onPressCta={handleNext}
      ctaDisabled={!trimmedName}
      error={error}
    >
      {/* Live ledger-header preview */}
      <View style={styles.ledgerCard}>
        <Text style={styles.ledgerEyebrow}>📒 KHATA — SHOP COPY</Text>
        <Text
          style={[
            styles.ledgerName,
            !trimmedName && styles.ledgerNamePlaceholder,
          ]}
          numberOfLines={1}
        >
          {trimmedName || "Your Shop Name"}
        </Text>
        <View style={styles.ledgerRule} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t.shopName || "SHOP NAME"}</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🏬</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              setError("");
            }}
            placeholder={t.shopNamePlaceholder || "e.g. Sharma General Store"}
            placeholderTextColor={theme.color.textSecondary}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleNext}
            maxLength={40}
          />
        </View>
      </View>

      <ApprovalStamp visible={!!trimmedName} label="Shop name looks great" />
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  ledgerCard: {
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 6,
    ...theme.shadow.card,
  },
  ledgerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.color.textSecondary,
    letterSpacing: 1,
  },
  ledgerName: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.color.primaryDeep,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  ledgerNamePlaceholder: { color: theme.color.textSecondary, fontWeight: "500" },
  ledgerRule: {
    height: 2,
    backgroundColor: theme.color.primaryTint,
    borderRadius: 1,
    marginTop: 8,
  },

  field: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.color.textSecondary,
    letterSpacing: 0.6,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    backgroundColor: theme.color.surfaceCard,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    gap: 10,
    ...theme.shadow.card,
  },
  inputIcon: { fontSize: 18, color: theme.color.primary },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: theme.color.textPrimary,
  },
});
