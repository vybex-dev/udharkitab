/**
 * app/onboarding/_layout.jsx
 * Shell for the whole onboarding flow: wraps every screen in
 * OnboardingProvider (shared draft answers) and renders the progress bar
 * fixed at the top, above whichever step is currently active.
 */

import { Stack, useSegments } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingProvider } from "../../contexts/OnboardingContext";
import OnboardingProgressBar from "../../components/onboarding/OnboardingProgressBar";
import { colors } from "../../constants/colors";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <OnboardingProgressBar />
        <View style={styles.body}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </View>
      </SafeAreaView>
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
});
