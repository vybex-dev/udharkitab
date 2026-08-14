/**
 * constants/translations/en.js
 * English strings for UdharKitab — complete.
 */
export const en = {
  // App
  appName: "Udhar Kitab",
  tagline: "Digital Khata",

  // Home screen
  totalPending: "Total Pending",
  todayReceived: "Received Today",
  addUdhar: "+ Add Udhar",
  settledCustomers: "Settled Customers",
  noUdhar: "No udhar yet",
  noUdharSub: "All accounts are settled",

  // Filters
  filterHighest: "Highest",
  filterRecent: "Recent",
  filterName: "A–Z",

  // Search
  searchPlaceholder: "Search customer name...",
  searchCancel: "Cancel",
  noResultsTitle: (q) => `"${q}" not found`,
  noResultsSub: "Check the spelling, or add a new customer",
  noResultsBadge: "No results",
  resultsBadge: (n) => `${n} customer${n === 1 ? "" : "s"} found`,

  // Customer detail
  markAllPaid: "✓ Settle All",
  markPaid: "Settle",
  allSettled: "All Settled ✓",
  entryGone: "Entry will disappear once settled",
  back: "Back",
  addUdharShort: "+ Udhar",
  settleAllTitle: "Settle all?",
  settleAllMessage: (name) => `Mark all of ${name}'s udhar as settled?`,
  allEntriesLabel: "All entries",
  noEntries: "No entries yet",

  // Entry row
  pendingTag: "● Pending",
  settleBtn: "Settle",
  settledBadge: "✓ Settled",
  dueTodayChip: "Due today",
  overdueChip: "Overdue",
  partiallyPaidTag: (paid, total) => `${paid} of ${total} received`,

  // Receive Payment (manual item-wise split payment)
  receivePayment: "Receive Payment",
  receivePaymentTitle: "Receive Payment",
  receivePaymentSubtitle: (name) => `Record an amount received from ${name}`,
  selectItemsLabel: "Which item(s) is this for?",
  allocatedOfAmount: (allocated, amount) =>
    `${allocated} of ${amount} allocated`,
  selectMoreItemsHint: "select an item to apply the rest",
  amountExceedsPending: (max) =>
    `Amount can't be more than total pending (${max})`,
  recordPaymentBtn: "✓ Record Payment",
  appliedTag: (amt) => `${amt} applied`,
  noPendingItems: "No pending items",

  // Add entry
  addEntryTitle: "Add Udhar",
  customerName: "Customer Name",
  amount: "Amount",
  note: "Note",
  notePlaceholder: "e.g. tea, groceries, clothes...",
  date: "Date",
  saveEntry: "✓ Save",
  newCustomer: "New customer will be created",
  nameRequired: "Enter the customer's name",
  invalidAmount: "Enter a valid amount",

  // Contact / phone
  contactNumber: "Contact Number",
  optional: "optional",
  required: "required",
  noPhone: "No number saved",
  selectHint: "select",
  call: "Call",
  whatsapp: "WhatsApp",
  addPhoneTitle: "Add a phone number",
  addPhoneSubtitle: (name) =>
    `Save a number for ${name} to call or message them`,
  phoneRequiredForDuplicate:
    "Phone number is required to distinguish between 2 customers with the same name",
  duplicateNameNotice: (name) =>
    `Another customer named "${name}" already exists. Add a phone number to tell them apart.`,
  addAnotherPerson: (name) => `Add another "${name}"`,
  phoneWillBeRequired: "Phone number will be required",

  // WhatsApp reminder — template picker sheet
  waPickerTitle: "Send a reminder",
  waPickerSubtitle: (name) => `Choose what to remind ${name} about`,
  waTemplateNoDateLabel: "Pending Udhar",
  waTemplateNoDateSub: "No return date set",
  waTemplateDueTodayLabel: "Due Today",
  waTemplateDueTodaySub: "Expected back today",
  waTemplateOverdueLabel: "Overdue",
  waTemplateOverdueSub: "Past the expected date",
  waTemplateEmptyHint: "No items in this category",

  // WhatsApp reminder — message templates
  // Each gets: customer name, a "• item – ₹amount" list, the bucket total, shop name
  waNoDateMessage: (name, items, total, shop) =>
    `Hi ${name}, this is a quick reminder from ${shop || "us"} 🙏\n\n` +
    `You have the following pending:\n${items}\n\n` +
    `Total pending: ${total}\n\n` +
    `Please clear it whenever convenient. Thank you!`,
  waDueTodayMessage: (name, items, total, shop) =>
    `Hi ${name}, reminder from ${shop || "us"} — today is the day you'd planned to return:\n\n` +
    `${items}\n\n` +
    `Total due today: ${total}\n\n` +
    `Please settle it today if possible. Thank you!`,
  waOverdueMessage: (name, items, total, shop) =>
    `Hi ${name}, this is from ${shop || "us"}. The following udhar is now overdue:\n\n` +
    `${items}\n\n` +
    `Total overdue: ${total}\n\n` +
    `Kindly clear it at the earliest. Thank you for your cooperation!`,

  // WhatsApp combined multi-bucket message
  waSendBtn: "Send via WhatsApp",
  waSectionDueToday: "Due Today",
  waSectionOverdue: "Overdue",
  waSectionNoDate: "Pending Udhar",
  waCombinedMessage: (name, sections, total, shop) =>
    `Hi ${name}, this is a reminder from ${shop || "us"} 🙏\n\n` +
    `${sections}\n\n` +
    `*Total pending: ${total}*\n\n` +
    `Kindly settle at your earliest convenience. Thank you!`,

  // Expected return date
  expectedReturnDate: "Expected Return Date",
  expectedReturnDateHint: "Set a date when you expect the amount back",
  dueDateOn: "Set ✓",
  dueDateOff: "Set date",

  // Due Today strip (home screen)
  dueTodaySection: "Due Today",

  // Overdue banner (customer detail)
  overdueTitle: (n) => `${n} overdue payment${n === 1 ? "" : "s"}`,
  overdueSubtitle: "Tap to update the expected return date",
  updateDueDate: "Update date",

  // Overdue modal
  updateDueDateTitle: "Update Expected Date",
  updateDueDateSubtitle: (n, name) =>
    `Update the expected return date for ${n} overdue entr${n === 1 ? "y" : "ies"} of ${name}`,
  updateDueDateConfirm: "✓ Update",

  // Login
  loginTagline: "Keep track of your udhar",
  loginTitle: "Welcome back",
  loginSubtitle: "Sign in with Google to continue",
  continueWithGoogle: "Continue with Google",
  sessionNotFound: "Session not found — please try again",

  // Paywall
  paywallBrand: "Udhar Kitab Pro",
  paywallSubtitle: "Keep tracking your udhar — subscribe now",
  subscribe: "Subscribe — ₹149/month",
  trialExpired: "Your free trial has ended",
  startTrialHeadline: "Start your free trial",
  freeTrialEnded: (days) => `Your ${days}-day free trial has ended`,
  freeTrialEndedSub: "Add your payment details to keep using Udhar Kitab — nothing is charged until you subscribe.",
  offlineExpiredHeadline: "No internet connection",
  offlineExpiredSub: "Turn on the internet to check your plan, then try again",
  retryConnection: "Try again",
  restorePurchase: "Restore purchase",
  planPrice: "₹149/month",
  perMonth: "/month",
  cancelAnytime: "Cancel anytime",
  planFeature1: "Unlimited customers",
  planFeature2: "Unlimited entries",
  planFeature3: "Data stays only on your phone",
  planFeature4: "Always free updates",
  noActiveSubscription: "No active subscription found",
  legal:
    "Subscribing will charge your Apple/Google account. The subscription renews automatically until you cancel.",

  // Settings
  settingsTitle: "Settings",
  done: "Done",
  shopSection: "Shop",
  shopName: "Shop Name",
  shopNamePlaceholder: "Enter a name",
  saveShop: "Save",
  planSection: "Plan",
  planStatus: "Plan",
  subscribeRow: "Subscribe",
  dataSection: "Data",
  dataWhereLabel: "Where is my data?",
  appSection: "App",
  appVersion: "Version",
  accountSection: "Account",
  logout: "Logout",
  logoutConfirmTitle: "Logout?",
  logoutConfirmMessage: "Are you sure you want to logout?",
  languageSection: "Language",
  changeLanguage: "Change Language",
  dataLocal: "All your udhar data stays only on your phone",
  bottomNote: "Udhar Kitab — Just yours, only on your phone 🔒",

  // Plan labels
  planTrial: "Free Trial",
  planActive: "Active",
  planExpired: "Expired",
  planOfflineNote: "(last known status — not confirmed online)",
  daysLeftLabel: (n) => `${n} day${n === 1 ? "" : "s"} left`,

  // Overdue banner (home screen)
  overdueBannerSingle: (name) => `${name} has an overdue payment`,
  overdueBannerMultiple: (n) => `${n} customers have overdue payments`,
  overdueBannerSubSingle: "Tap to view & update return date",
  overdueBannerSubMultiple: "Tap to see who",

  // Overdue modal (home screen)
  overdueModalTitle: "Overdue Payments",
  overdueModalSubtitle: "Tap a customer to view & update their return date",
  overdueEntryCount: (n) =>
    n === 1 ? "1 overdue entry" : `${n} overdue entries`,
  close: "Close",

  // Home screen — Pending/Settled toggle
  pendingTab: "Pending",
  settledTab: "Settled",
  noSettledCustomersTitle: "No settled customers yet",
  noSettledCustomersSub:
    "Customers show up here once all their udhar is cleared.",

  // Analytics screen
  analyticsTitle: "Analytics",
  totalOutstanding: "Outstanding",
  totalOverdue: "Overdue",
  totalCollected: "Collected (all-time)",
  customersWord: "customers",
  givenLabel: "Given",
  collectedLabel: "Collected",
  collectionRateLabel: "Collection rate",
  thisWeekVsLast: "This Week vs Last Week",
  thisMonthVsLast: "This Month vs Last Month",
  monthlyHistoryTitle: "Last 6 Months",
  monthColumn: "Month",
  topDebtorsTitle: "Top Debtors",
  overdueListTitle: "Overdue",
  noOverdueCustomers: "No overdue customers right now 🎉",

  // Delete customer
  deleteCustomerTitle: "Delete customer?",
  deleteCustomerMessage: (name) =>
    `This will permanently delete ${name} and all their udhar entries and payment history. This cannot be undone.`,
  delete: "Delete",

  // Settle confirmation (single entry, ₹200+) & phone validation
  settleConfirmTitle: "Settle this udhar?",
  settleConfirmMessage: (amount) => `Mark ${amount} as settled?`,
  typeConfirmPlaceholder: 'Type "confirm" to proceed',
  invalidPhoneNumber: "Please enter a valid 10-digit phone number, or leave it blank.",
  phoneAlreadyUsedBy: (name) =>
    `This number is already saved for ${name}. Please use a different number, or search for ${name} above and select them instead.`,

  // Generic
  loading: "Loading...",
  error: "Something went wrong",
  retry: "Try again",
  save: "Save",
  cancel: "Cancel",
  confirm: "OK",

  // Onboarding Trial Screen
  trialFeature1: () => "100% free of cost forever",
  trialFeature2: "No card or payment details required",
  trialFeature3: "Track unlimited customers and udhar",
  trialFeature4: "Your data stays only on your phone",
  trialKhataReadyEyebrow: "Your khata is ready",
  trialKhataReadyTitle: "Your shop's ledger is ready",
  trialKhataReadySub: () => "Start tracking your shop's udhaar today — 100% free of cost.",
  trialStartCta: () => "Open My Ledger",
  trialOpeningCta: "Opening your khata...",
  trialLegalNote: () => "Udhar Kitab is 100% free of cost. All data stays secure on your device.",
  trialCoverOpened: "Opened",
  trialCoverLang: "Language",
  trialCoverReady: "✓ READY TO USE",
  trialBadgeTitle: "100% FREE",
  trialBadgeSubtitle: "No payment details needed",
};
