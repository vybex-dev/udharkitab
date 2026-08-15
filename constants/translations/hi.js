/**
 * constants/translations/hi.js
 * Hindi strings — maximum Hindi, minimal English.
 */
export const hi = {
  // App
  appName: "Udhar Kitab",
  tagline: "डिजिटल खाता",

  // Home screen
  totalPending: "कुल बाकी",
  todayReceived: "आज मिला",
  addUdhar: "+ उधार दिया",
  settledCustomers: "चुकता हुए ग्राहक",
  noUdhar: "कोई उधार नहीं",
  noUdharSub: "सब हिसाब बराबर है",

  // Filters
  filterHighest: "सबसे ज़्यादा",
  filterRecent: "हाल का",
  filterName: "A–Z",

  // Search
  searchPlaceholder: "ग्राहक का नाम खोजें...",
  searchCancel: "रद्द",
  noResultsTitle: (q) => `"${q}" नहीं मिला`,
  noResultsSub: "नाम जाँचें या नया ग्राहक जोड़ें",
  noResultsBadge: "कोई नहीं मिला",
  resultsBadge: (n) => `${n} ग्राहक मिले`,

  // Customer detail
  markAllPaid: "✓ सब चुकता करें",
  markPaid: "चुकता",
  allSettled: "सब चुकता ✓",
  entryGone: "चुकता होने पर हट जाएगी",
  back: "वापस",
  addUdharShort: "+ उधार",
  settleAllTitle: "सब चुकता करें?",
  settleAllMessage: (name) => `${name} के सभी उधार को चुकता मार्क करें?`,
  allEntriesLabel: "सभी लेन-देन",
  noEntries: "कोई लेन-देन नहीं",

  // Entry row
  pendingTag: "● बाकी",
  settleBtn: "चुकता करें",
  settledBadge: "✓ चुकता",
  dueTodayChip: "आज वापसी",
  overdueChip: "देर हो गई",
  partiallyPaidTag: (paid, total) => `${total} में से ${paid} मिले`,

  // Receive Payment (manual item-wise split payment)
  receivePayment: "भुगतान लें",
  receivePaymentTitle: "भुगतान लें",
  receivePaymentSubtitle: (name) => `${name} से मिली रकम दर्ज करें`,
  selectItemsLabel: "यह रकम किस एंट्री के लिए है?",
  allocatedOfAmount: (allocated, amount) =>
    `${amount} में से ${allocated} बाँटी गई`,
  selectMoreItemsHint: "बाकी रकम के लिए एक और एंट्री चुनें",
  amountExceedsPending: (max) =>
    `रकम कुल बाकी (${max}) से ज़्यादा नहीं हो सकती`,
  recordPaymentBtn: "✓ भुगतान दर्ज करें",
  appliedTag: (amt) => `${amt} लगाई गई`,
  noPendingItems: "कोई बाकी एंट्री नहीं",

  // Add entry
  addEntryTitle: "उधार दिया",
  customerName: "ग्राहक का नाम",
  amount: "रुपये",
  note: "नोट",
  notePlaceholder: "जैसे: चाय, राशन, कपड़े...",
  date: "तारीख",
  saveEntry: "✓ सहेजें",
  newCustomer: "नया ग्राहक बनेगा",
  nameRequired: "ग्राहक का नाम डालें",
  invalidAmount: "सही रुपये डालें",

  // Contact / phone
  contactNumber: "मोबाइल नंबर",
  optional: "ज़रूरी नहीं",
  required: "ज़रूरी",
  noPhone: "नंबर नहीं है",
  selectHint: "चुनें",
  call: "कॉल",
  whatsapp: "WhatsApp",
  addPhoneTitle: "मोबाइल नंबर जोड़ें",
  addPhoneSubtitle: (name) => `${name} को कॉल या मैसेज करने के लिए नंबर सहेजें`,
  phoneRequiredForDuplicate:
    "एक ही नाम के 2 ग्राहकों को अलग पहचानने के लिए मोबाइल नंबर ज़रूरी है",
  duplicateNameNotice: (name) =>
    `"${name}" नाम का ग्राहक पहले से मौजूद है। अलग पहचान के लिए मोबाइल नंबर डालें।`,
  addAnotherPerson: (name) => `दूसरा "${name}" जोड़ें`,
  phoneWillBeRequired: "मोबाइल नंबर ज़रूरी होगा",

  // WhatsApp reminder — template picker sheet
  waPickerTitle: "रिमाइंडर भेजें",
  waPickerSubtitle: (name) => `${name} को किस बारे में याद दिलाना है?`,
  waTemplateNoDateLabel: "बाकी उधार",
  waTemplateNoDateSub: "कोई वापसी तारीख तय नहीं",
  waTemplateDueTodayLabel: "आज वापसी",
  waTemplateDueTodaySub: "आज वापस मिलना है",
  waTemplateOverdueLabel: "देर हो गई",
  waTemplateOverdueSub: "तय तारीख निकल चुकी है",
  waTemplateEmptyHint: "इस श्रेणी में कोई एंट्री नहीं",

  // WhatsApp reminder — message templates
  // हर एक को मिलता है: ग्राहक का नाम, "• आइटम – ₹रकम" की लिस्ट, कुल रकम, दुकान का नाम
  waNoDateMessage: (name, items, total, shop) =>
    `नमस्ते ${name} जी, ${shop || "हमारी तरफ़ से"} एक छोटी सी याद दिलाना चाहते हैं 🙏\n\n` +
    `आपका इतना उधार बाकी है:\n${items}\n\n` +
    `कुल बाकी: ${total}\n\n` +
    `जब भी सुविधा हो, कृपया चुकता कर दें। धन्यवाद!`,
  waDueTodayMessage: (name, items, total, shop) =>
    `नमस्ते ${name} जी, ${shop || "हमारी तरफ़ से"} याद दिला रहे हैं — आज वापसी की तय तारीख है:\n\n` +
    `${items}\n\n` +
    `आज की कुल रकम: ${total}\n\n` +
    `कृपया आज ही चुकता करने की कोशिश करें। धन्यवाद!`,
  waOverdueMessage: (name, items, total, shop) =>
    `नमस्ते ${name} जी, यह ${shop || "हमारी तरफ़ से"} संदेश है। यह उधार अब देरी से है:\n\n` +
    `${items}\n\n` +
    `कुल देरी से बाकी: ${total}\n\n` +
    `कृपया जल्द से जल्द चुकता करें। आपके सहयोग के लिए धन्यवाद!`,

  // WhatsApp combined multi-bucket message
  waSendBtn: "WhatsApp से भेजें",
  waSectionDueToday: "आज वापसी",
  waSectionOverdue: "देरी से बाकी",
  waSectionNoDate: "बाकी उधार",
  waCombinedMessage: (name, sections, total, shop) =>
    `नमस्ते ${name} जी, ${shop || "हमारी तरफ़ से"} याद दिला रहे हैं 🙏\n\n` +
    `${sections}\n\n` +
    `*कुल बाकी: ${total}*\n\n` +
    `कृपया जल्द से जल्द चुकता कर दें। धन्यवाद!`,

  // Expected return date
  expectedReturnDate: "वापसी की उम्मीद तारीख",
  expectedReturnDateHint: "वो तारीख डालें जब रुपये वापस मिलने की उम्मीद है",
  dueDateOn: "सेट ✓",
  dueDateOff: "तारीख सेट करें",

  // Due Today strip (home screen)
  dueTodaySection: "आज वापसी",

  // Overdue banner (customer detail)
  overdueTitle: (n) => `${n} भुगतान में देरी`,
  overdueSubtitle: "नई वापसी तारीख सेट करने के लिए दबाएं",
  updateDueDate: "तारीख बदलें",

  // Overdue modal
  updateDueDateTitle: "नई वापसी तारीख",
  updateDueDateSubtitle: (n, name) =>
    `${name} के ${n} पुराने उधार की नई वापसी तारीख सेट करें`,
  updateDueDateConfirm: "✓ अपडेट करें",

  // वेलकम (पहली स्क्रीन, नया या वापसी उपयोगकर्ता)
  welcomeTagline: "अपने उधार का हिसाब रखें",
  welcomeTitle: "चलिए शुरू करते हैं",
  welcomeSubtitle: "क्या आप यहाँ नए हैं, या आपका खाता पहले से बना हुआ है?",
  welcomeNewCta: "मैं नया हूँ — शुरू करें",
  welcomeReturningCta: "मेरा खाता पहले से है",

  // Login
  loginTagline: "अपने उधार का हिसाब रखें",
  loginTitle: "वापसी पर स्वागत है",
  loginSubtitle: "जारी रखने के लिए Google से साइन इन करें",
  loginNoAccountFound: "इस Google खाते के लिए हमें कोई मौजूदा खाता नहीं मिला।",
  loginSetUpInstead: "इसके बजाय नया खाता बनाएँ →",
  continueWithGoogle: "Google से जारी रखें",
  sessionNotFound: "सत्र नहीं मिला — दोबारा कोशिश करें",

  // Paywall
  paywallBrand: "Udhar Kitab Pro",
  paywallSubtitle: "अपना उधार देखते रहें — सदस्यता लें",
  subscribe: "सदस्यता लें — ₹149/माह",
  trialExpired: "मुफ़्त परीक्षण खत्म हो गया",
  startTrialHeadline: "मुफ़्त परीक्षण शुरू करें",
  freeTrialEnded: (days) => `आपका ${days} दिन का मुफ़्त परीक्षण खत्म हो गया`,
  freeTrialEndedSub:
    "Udhar Kitab का उपयोग जारी रखने के लिए भुगतान जानकारी जोड़ें — जब तक आप सदस्यता नहीं लेते, कोई शुल्क नहीं लगेगा।",
  offlineExpiredHeadline: "इंटरनेट नहीं है",
  offlineExpiredSub:
    "योजना की जानकारी जाँचने के लिए इंटरनेट चालू करें और फिर से कोशिश करें",
  retryConnection: "दोबारा कोशिश करें",
  restorePurchase: "पुरानी खरीद वापस पाएं",
  planPrice: "₹149/माह",
  perMonth: "/माह",
  cancelAnytime: "कभी भी रद्द करें",
  planFeature1: "असीमित ग्राहक",
  planFeature2: "असीमित लेन-देन",
  planFeature3: "डेटा सिर्फ आपके फोन पर",
  planFeature4: "मुफ़्त अपडेट हमेशा",
  noActiveSubscription: "कोई सक्रिय सदस्यता नहीं मिली",
  legal:
    "सदस्यता लेने पर आपके Apple/Google खाते से भुगतान होगा। सदस्यता अपने आप नवीनीकृत होती रहती है जब तक आप रद्द न करें।",

  // Settings
  settingsTitle: "सेटिंग्स",
  done: "हो गया",
  shopSection: "दुकान",
  shopName: "दुकान का नाम",
  shopNamePlaceholder: "नाम डालें",
  saveShop: "सहेजें",
  planSection: "योजना",
  planStatus: "योजना",
  subscribeRow: "सदस्यता लें",
  dataSection: "डेटा",
  dataWhereLabel: "डेटा कहाँ है?",
  cloudSyncLabel: "क्लाउड पर सिंक करें",
  privacyPolicyLabel: "गोपनीयता नीति",
  appSection: "ऐप",
  appVersion: "संस्करण",
  accountSection: "खाता",
  logout: "लॉग आउट",
  logoutConfirmTitle: "लॉग आउट?",
  logoutConfirmMessage: "क्या आप लॉग आउट करना चाहते हैं?",
  deleteAccount: "खाता डिलीट करें",
  deleteAccountError: "खाता डिलीट करने में कुछ गड़बड़ हो गई। कृपया अपना इंटरनेट कनेक्शन जांचें और फिर से कोशिश करें।",

  // खाता डिलीट फ्लो — चरण 1 (अनुरोध)
  deletePleaTitle: "कृपया मत जाइए 🥺",
  deletePleaSubtitle: "खाता डिलीट करने से Udhar Kitab में सब कुछ हमेशा के लिए मिट जाएगा। आप यह सब पीछे छोड़ देंगे:",
  deletePleaStatsCustomers: (n) => `${n} ग्राहक जिनका आप हिसाब रख रहे हैं`,
  deletePleaStatsPending: (amount) => `${amount} का बकाया उधार जिसका हिसाब खो जाएगा`,
  deletePleaStatsForever: "इसके बाद कुछ भी वापस नहीं मिलेगा।",
  deleteKeepAccount: "मेरा खाता रखें",
  deleteStillWantTo: "मुझे फिर भी अपना खाता डिलीट करना है",

  // खाता डिलीट फ्लो — चरण 2 (लॉगआउट का विकल्प)
  deleteDetourTitle: "बस थोड़ा ब्रेक चाहिए?",
  deleteDetourSubtitle: "लॉग आउट करने से हर ग्राहक, एंट्री और भुगतान सुरक्षित रहता है — आप कभी भी वापस लॉग इन कर सकते हैं। खाता डिलीट करना वापस नहीं हो सकता।",
  deleteLogoutInstead: "इसके बजाय लॉग आउट करें",
  deletePermanently: "नहीं, मेरा खाता हमेशा के लिए डिलीट करें",

  // खाता डिलीट फ्लो — चरण 3 (अंतिम पुष्टि)
  deleteFinalTitle: "यह स्थायी है",
  deleteFinalSubtitle: "आपका खाता, दुकान की प्रोफ़ाइल और सारा स्थानीय उधार डेटा तुरंत मिट जाएगा। इसे वापस नहीं लाया जा सकता।",
  deleteConfirmWord: "DELETE",
  deleteTypePrompt: (word) => `पुष्टि के लिए ${word} टाइप करें`,
  deleteConfirmButton: "मेरा खाता हमेशा के लिए डिलीट करें",

  languageSection: "भाषा",
  changeLanguage: "भाषा बदलें",
  dataLocal: "सारा उधार डेटा सिर्फ आपके फोन पर है",
  dataSynced: "क्लाउड पर बैकअप है",
  cloudSyncOnHint: "आपके ग्राहक, एंट्री और भुगतान क्लाउड पर सुरक्षित हैं। इसे कभी भी बंद करके सिंकिंग रोकें और क्लाउड की प्रति हटाएं।",
  cloudSyncOffHint: "आपका डेटा सिर्फ इस फोन पर है। फोन बदलने पर सुरक्षित रहे, इसके लिए इसे चालू करें।",

  // Network gate (login + settings sync toggle, only shown when sync needs the network)
  networkErrorTitle: "इंटरनेट कनेक्शन नहीं है",
  networkErrorSubtitle: "क्लाउड सिंक चालू है, इसलिए इस चरण के लिए इंटरनेट ज़रूरी है। कनेक्शन जांचें और फिर से कोशिश करें।",
  networkErrorRetry: "फिर से कोशिश करें",
  networkErrorRetrying: "जांच हो रही है...",
  bottomNote: "Udhar Kitab — सिर्फ आपका, सिर्फ आपके फोन पर 🔒",

  // Plan labels
  planTrial: "मुफ़्त परीक्षण",
  planActive: "सक्रिय",
  planExpired: "समाप्त",
  planOfflineNote: "(पिछली जानकारी — अभी इंटरनेट से नहीं मिली)",
  daysLeftLabel: (n) => `${n} दिन बचे`,

  // Overdue banner (home screen)
  overdueBannerSingle: (name) => `${name} का भुगतान देर से है`,
  overdueBannerMultiple: (n) => `${n} ग्राहकों का भुगतान देर से है`,
  overdueBannerSubSingle: "देखने व तारीख बदलने के लिए दबाएं",
  overdueBannerSubMultiple: "देखने के लिए दबाएं",

  // Overdue modal (home screen)
  overdueModalTitle: "देरी से भुगतान",
  overdueModalSubtitle: "ग्राहक को दबाएं और वापसी तारीख बदलें",
  overdueEntryCount: (n) => `${n} देरी से बाकी`,
  close: "बंद करें",

  // Home screen — Pending/Settled toggle
  pendingTab: "बाकी",
  settledTab: "चुकता",
  noSettledCustomersTitle: "अभी कोई चुकता ग्राहक नहीं",
  noSettledCustomersSub:
    "जब किसी ग्राहक का पूरा उधार चुकता हो जाएगा, वो यहाँ दिखेगा।",

  // Analytics screen
  analyticsTitle: "विश्लेषण",
  totalOutstanding: "कुल बाकी",
  totalOverdue: "देरी से बाकी",
  totalCollected: "कुल वसूली (अब तक)",
  customersWord: "ग्राहक",
  givenLabel: "दिया गया",
  collectedLabel: "वसूला गया",
  collectionRateLabel: "वसूली दर",
  thisWeekVsLast: "इस हफ़्ते बनाम पिछला हफ़्ता",
  thisMonthVsLast: "इस महीने बनाम पिछला महीना",
  monthlyHistoryTitle: "पिछले 6 महीने",
  monthColumn: "महीना",
  topDebtorsTitle: "सबसे ज़्यादा बाकी वाले",
  overdueListTitle: "देरी से बाकी",
  noOverdueCustomers: "फ़िलहाल कोई देरी से बाकी नहीं है 🎉",

  // Delete customer
  deleteCustomerTitle: "ग्राहक हटाएं?",
  deleteCustomerMessage: (name) =>
    `इससे ${name} और उनके सभी उधार व भुगतान का रिकॉर्ड हमेशा के लिए हट जाएगा। यह वापस नहीं हो सकता।`,
  delete: "हटाएं",

  // Settle confirmation (single entry, ₹200+) & phone validation
  settleConfirmTitle: "यह उधार चुकता करें?",
  settleConfirmMessage: (amount) => `${amount} को चुकता मार्क करें?`,
  typeConfirmPlaceholder: 'आगे बढ़ने के लिए "confirm" लिखें',
  invalidPhoneNumber: "सही 10 अंकों का मोबाइल नंबर डालें, या खाली छोड़ दें।",
  phoneAlreadyUsedBy: (name) =>
    `यह नंबर पहले से ${name} के नाम सहेजा है। कृपया दूसरा नंबर डालें, या ऊपर ${name} को खोज कर चुनें।`,

  // Generic
  loading: "लोड हो रहा है...",
  error: "कुछ गड़बड़ हुई",
  retry: "दोबारा कोशिश करें",
  save: "सहेजें",
  cancel: "रद्द करें",
  confirm: "ठीक है",
  continueCta: "जारी रखें",

  // ऑनबोर्डिंग — चरण 1: भाषा
  onboardingWelcomeEyebrow: "स्वागत है",
  onboardingLanguageTitle: "आपकी डिजिटल खाता बही, बिल्कुल आसान।",
  onboardingLanguageSubtitle: "बिना कागज़ी काम के उधार और भुगतान का हिसाब रखें।",
  onboardingLanguageStamp: "भाषा तय हो गई",

  // ऑनबोर्डिंग — चरण 2: दुकान का नाम
  onboardingShopEyebrow: "आपकी दुकान",
  onboardingShopTitle: "आपकी दुकान का नाम क्या है?",
  onboardingShopSubtitle: "चलिए अपनी डिजिटल खाता बही को निजी बनाते हैं।",
  onboardingShopLedgerEyebrow: "📒 खाता — दुकान की प्रति",
  onboardingShopLedgerPlaceholder: "आपकी दुकान का नाम",
  onboardingShopStamp: "दुकान का नाम बढ़िया है",
  shopNameRequired: "अपनी दुकान का नाम डालें",

  // ऑनबोर्डिंग — चरण 3: थीम
  onboardingThemeEyebrow: "रूप-रंग",
  onboardingThemeTitle: "Udhar Kitab को अपने अंदाज़ में बनाएं।",
  onboardingThemeSubtitle: "वह रूप चुनें जो आपको हर दिन पसंद आएगा।",
  onboardingThemeStamp: "स्टाइल सहेजी गई",
  themeLightLabel: "लाइट",
  themeLightSub: "साफ़ और उजला",
  themeDarkLabel: "डार्क",
  themeDarkSub: "आंखों के लिए आरामदायक — जल्द आ रहा है",
  themeComingSoonBadge: "जल्द",

  // ऑनबोर्डिंग — चरण 4: Google साइन-इन
  onboardingGoogleEyebrow: "अपना खाता सुरक्षित करें",
  onboardingGoogleTitle: "चलिए आपका खाता सुरक्षित करते हैं।",
  onboardingGoogleSubtitle: "जारी रखने के लिए Google से साइन इन करें — यह तेज़ और सुरक्षित है।",
  onboardingGoogleStamp: "साइन इन हो गया",
  onboardingGoogleTrust: "हम आपके Google खाते का इस्तेमाल सिर्फ आपकी खाता बही बनाने और सुरक्षित करने के लिए करते हैं। कोई OTP नहीं, कोई पासवर्ड नहीं।",

  // Onboarding — Step 5: गोपनीयता और क्लाउड सिंक
  onboardingSyncEyebrow: "आपका डेटा, आपकी पसंद",
  onboardingSyncTitle: "हम आपका डेटा कैसे संभालें?",
  onboardingSyncSubtitle: "खाता बही खोलने से पहले एक छोटा-सा सवाल।",
  onboardingSyncRequiredBadge: "ज़रूरी",
  onboardingSyncPrivacyTitle: "मैंने गोपनीयता नीति पढ़ ली है और सहमत हूं",
  onboardingSyncPrivacyDescription:
    "जारी रखने के लिए ज़रूरी — यह बताती है कि हम क्या जानकारी लेते हैं और उसका इस्तेमाल कैसे करते हैं।",
  onboardingSyncPrivacyLink: "गोपनीयता नीति पढ़ें →",
  onboardingSyncPrivacyRequired: "जारी रखने के लिए कृपया गोपनीयता नीति से सहमत हों।",
  onboardingSyncCloudTitle: "मेरे ग्राहकों का डेटा क्लाउड पर बैकअप करें",
  onboardingSyncCloudDescription:
    "वैकल्पिक। आपके ग्राहक, उधार एंट्री और भुगतान आपके Google खाते से जुड़े एक सुरक्षित क्लाउड डेटाबेस में सुरक्षित रहते हैं, ताकि फोन बदलने पर कुछ न खोए। इसे कभी भी सेटिंग्स से चालू या बंद कर सकते हैं।",
  onboardingSyncNote:
    "आपकी खाता बही दोनों ही स्थिति में पूरी तरह ऑफ़लाइन काम करती है। यह सिर्फ यह तय करता है कि आपके डेटा की एक प्रति क्लाउड पर भी रखी जाए या नहीं।",
  onboardingSyncStamp: "पसंद सहेजी गई",

  // Onboarding Trial Screen
  trialFeature1: () => "हमेशा के लिए 100% मुफ़्त",
  trialFeature2: "शुरू करने के लिए कोई कार्ड या भुगतान नहीं चाहिए",
  trialFeature3: "असीमित ग्राहकों का हिसाब रखें",
  trialFeature4: "डेटा सिर्फ आपके फोन पर सुरक्षित है",
  trialKhataReadyEyebrow: "आपका खाता तैयार है",
  trialKhataReadyTitle: "दुकान का बहीखाता तैयार है",
  trialKhataReadySub: () => "आज ही अपने उधार का हिसाब रखना शुरू करें — बिल्कुल मुफ़्त।",
  trialStartCta: () => "मेरा बहीखाता खोलें",
  trialOpeningCta: "खाता खोल रहे हैं...",
  trialLegalNote: () => "Udhar Kitab 100% मुफ़्त है। सारा डेटा आपके फोन पर सुरक्षित रहता है।",
  trialCoverOpened: "शुरू हुआ",
  trialCoverLang: "भाषा",
  trialCoverReady: "✓ इस्तेमाल के लिए तैयार",
  trialBadgeTitle: "100% मुफ़्त",
  trialBadgeSubtitle: "कोई भुगतान विवरण नहीं चाहिए",
};
