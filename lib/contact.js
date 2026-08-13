/**
 * lib/contact.js
 * Small helpers for handing a phone number off to the device — opening the
 * dialer pre-filled with the number. Does not place the call itself; the
 * shopkeeper still taps "Call" inside their own phone app.
 */

import { Linking, Alert } from "react-native";

/**
 * Opens the device's default call screen with `phone` pre-filled.
 * `phone` can be a raw 10-digit number or one already including a country
 * code (e.g. "+919999999999") — both work fine with the tel: scheme.
 */
export async function dialNumber(phone, t) {
  const cleaned = (phone || "").replace(/[^\d+]/g, "");
  if (!cleaned) return;

  const url = `tel:${cleaned}`;
  try {
    // NOTE: Linking.canOpenURL('tel:...') is unreliable on Android 11+
    // (API 30+) because of package visibility restrictions — it can
    // return false even when a dialer is installed and openURL would
    // succeed. tel: is a standard scheme supported on every phone, so we
    // skip the canOpenURL check and just try to open it directly.
    await Linking.openURL(url);
  } catch (e) {
    console.error("dialNumber error:", e);
    Alert.alert(t?.error ?? "Something went wrong", t?.retry ?? "Try again");
  }
}
