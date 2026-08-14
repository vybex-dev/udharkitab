/**
 * components/GoogleSignInButton.jsx
 * The one and only sign-in control in the app: a white, Google-branded
 * "Continue with Google" button. Used on both app/login.jsx (returning
 * users) and app/onboarding/google.jsx (first-time signup).
 */

import { Pressable, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function GoogleSignInButton({ onPress, loading = false, label = "Continue with Google" }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        pressed && styles.btnPressed,
        loading && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color="#3C4043" />
      ) : (
        <View style={styles.content}>
          <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.icon} />
          <Text style={styles.text}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DADCE0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.7 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  icon: { marginRight: 12 },
  text: { fontSize: 16, fontWeight: "600", color: "#3C4043" },
});
