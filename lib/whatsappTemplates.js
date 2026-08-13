/**
 * lib/whatsappTemplates.js
 * Builds the 3 fixed WhatsApp reminder messages and opens WhatsApp with the
 * message pre-filled in that customer's chat. Doesn't send anything itself —
 * the shopkeeper still taps Send inside WhatsApp.
 *
 * The three buckets, mirroring how entries are categorized everywhere else
 * in the app (see lib/db.js getOverdueEntries / EntryRow.jsx):
 *   - noDate:   unsettled entries with no due_date at all
 *   - dueToday: unsettled entries whose due_date is today
 *   - overdue:  unsettled entries whose due_date has already passed
 */

import { Linking, Alert } from "react-native";
import { formatRupees, relativeLabel, todayISO } from "./date";

// ── Bucketing ──────────────────────────────────────────────────────────────

/**
 * Splits a customer's unsettled entries into the 3 fixed buckets.
 * Entries are expected to already be filtered to `settled === 0` (any
 * settled entries passed in are ignored defensively).
 */
export function bucketEntries(entries) {
  const today = todayISO();
  const buckets = { noDate: [], dueToday: [], overdue: [] };

  for (const entry of entries || []) {
    if (entry.settled) continue;
    if (!entry.due_date) {
      buckets.noDate.push(entry);
    } else if (entry.due_date === today) {
      buckets.dueToday.push(entry);
    } else if (entry.due_date < today) {
      buckets.overdue.push(entry);
    }
    // future-dated entries (due_date > today) intentionally fall into none
    // of the 3 buckets — nothing to remind about yet.
  }
  return buckets;
}

function remainingOf(entry) {
  return entry.amount - (entry.paid_amount || 0);
}

function bucketTotal(items) {
  return items.reduce((sum, e) => sum + remainingOf(e), 0);
}

// ── Message builders ──────────────────────────────────────────────────────
// Each builder gets: customer name, the bucket's entries, language, and an
// optional shop name (falls back to the app name if not provided).

function itemLines(items, language) {
  return items
    .map((e) => {
      const label = e.note?.trim() || relativeLabel(e.date, language);
      return `• ${label} – ${formatRupees(remainingOf(e))}`;
    })
    .join("\n");
}

function buildNoDateMessage({ customerName, items, t, language, shopName }) {
  return t.waNoDateMessage(
    customerName,
    itemLines(items, language),
    formatRupees(bucketTotal(items)),
    shopName,
  );
}

function buildDueTodayMessage({ customerName, items, t, language, shopName }) {
  return t.waDueTodayMessage(
    customerName,
    itemLines(items, language),
    formatRupees(bucketTotal(items)),
    shopName,
  );
}

function buildOverdueMessage({ customerName, items, t, language, shopName }) {
  return t.waOverdueMessage(
    customerName,
    itemLines(items, language),
    formatRupees(bucketTotal(items)),
    shopName,
  );
}

const BUILDERS = {
  noDate: buildNoDateMessage,
  dueToday: buildDueTodayMessage,
  overdue: buildOverdueMessage,
};

/**
 * Builds one combined WhatsApp message covering all selected buckets.
 *
 * selectedKeys — array of bucket keys the shopkeeper checked,
 *   e.g. ["dueToday", "overdue"] or ["dueToday", "noDate"] etc.
 *
 * Section order is always: dueToday -> overdue -> noDate (most urgent first),
 * regardless of the order the user ticked them.
 *
 * Each selected bucket that has items gets its own headed section; the grand
 * total across all selected buckets is shown at the bottom.
 */
export function buildCombinedMessage({
  selectedKeys,
  buckets,
  customerName,
  t,
  language,
  shopName,
}) {
  // Priority render order — most urgent first
  const ORDER = ["dueToday", "overdue", "noDate"];
  const active = ORDER.filter(
    (k) => selectedKeys.includes(k) && buckets[k]?.length,
  );
  if (!active.length) return "";

  const sections = active.map((k) => {
    const items = buckets[k];
    const heading = {
      dueToday: t.waSectionDueToday,
      overdue: t.waSectionOverdue,
      noDate: t.waSectionNoDate,
    }[k];
    return `*${heading}*\n${itemLines(items, language)}`;
  });

  const grandTotal = active.reduce(
    (sum, k) => sum + bucketTotal(buckets[k]),
    0,
  );

  return t.waCombinedMessage(
    customerName,
    sections.join("\n\n"),
    formatRupees(grandTotal),
    shopName,
  );
}

// ── Opening WhatsApp ───────────────────────────────────────────────────────

/**
 * Opens that customer's WhatsApp chat with `message` pre-filled in the
 * input box. The shopkeeper still has to tap Send inside WhatsApp — this
 * never sends anything on its own.
 *
 * `phone` should already include the country code (e.g. "+919999999999"),
 * same format the rest of the app stores it in.
 */
export async function openWhatsAppChat(phone, message, t) {
  const cleaned = (phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!cleaned) return;

  const encodedMsg = encodeURIComponent(message);
  // wa.me works whether or not the WhatsApp app scheme is registered, and
  // correctly opens the WhatsApp app directly on both iOS and Android when
  // it's installed (falls back to a browser prompt if it isn't).
  const url = `https://wa.me/${cleaned}?text=${encodedMsg}`;

  try {
    await Linking.openURL(url);
  } catch (e) {
    console.error("openWhatsAppChat error:", e);
    Alert.alert(t?.error ?? "Something went wrong", t?.retry ?? "Try again");
  }
}
