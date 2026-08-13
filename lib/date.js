/**
 * lib/date.js
 * Date helpers — language-aware formatting.
 *
 */

const HINDI_MONTHS = [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

const ENGLISH_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * 'YYYY-MM-DD' → '14 Jun 2025' or '14 जून 2025'
 */
export function formatDate(isoDate, language = "en") {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const months = language === "hi" ? HINDI_MONTHS : ENGLISH_MONTHS;
  return `${d} ${months[m - 1]} ${y}`;
}

/** Legacy alias — kept so any other callers don't break */
export function formatDateHindi(isoDate) {
  return formatDate(isoDate, "hi");
}

/**
 * Returns today as 'YYYY-MM-DD' (local time, not UTC).
 */
export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 'YYYY-MM-DD' → Date object at midnight local time.
 */
export function isoToDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date object → 'YYYY-MM-DD'
 */
export function dateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Relative label respecting language:
 *   en → 'Today', 'Yesterday', '14 Jun 2025'
 *   hi → 'आज',   'कल',        '14 जून 2025'
 */

export function relativeLabel(isoDate, language = "en") {
  if (!isoDate) return "";
  const today = todayISO();
  if (isoDate === today) return language === "hi" ? "आज" : "Today";

  const yesterday = dateToISO(new Date(Date.now() - 86400000));
  if (isoDate === yesterday) return language === "hi" ? "कल" : "Yesterday";

  return formatDate(isoDate, language);
}

/**
 * Format rupees: 1234.5 → '₹1,234'
 */
export function formatRupees(amount) {
  const n = Math.round(Number(amount) || 0);
  return "₹" + n.toLocaleString("en-IN");
}
