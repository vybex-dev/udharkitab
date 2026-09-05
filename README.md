<div align="center">
  <img src="assets/icon.png" alt="UdharKitab logo" width="120" />

# UdharKitab (उधार किताब)

**A shopkeeper's credit book, digitized.**

[![Repo](https://img.shields.io/badge/GitHub-vybex--dev%2Fudharkitab-181717?logo=github)](https://github.com/vybex-dev/udharkitab)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)](https://expo.dev)
[![RevenueCat](https://img.shields.io/badge/Powered%20by-RevenueCat-F2545B?logo=revenuecat)](https://www.revenuecat.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

UdharKitab replaces the paper _udhar khata_ that small shopkeepers across India use to track credit given to regular customers. It's offline-first, bilingual (Hindi/English), and built for someone who has never used a business app before.

Built with React Native + Expo · SQLite-first with optional cloud backup · RevenueCat-powered subscriptions.

---

## Table of Contents

- [Why](#why)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [RevenueCat Setup](#revenuecat-setup)
- [Firebase Setup](#firebase-setup)
- [Privacy Policy](#privacy-policy)
- [Scripts](#scripts)
- [Architecture Notes](#architecture-notes)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why

Most credit-tracking apps assume the user is comfortable with English, spreadsheets, and a stable internet connection. UdharKitab doesn't. It's designed for a _kirana_ store owner who:

- thinks in Hindi, not English
- needs the app to work the same with or without signal
- wants one glance to know who owes what, and who's overdue
- wants to nudge a customer over WhatsApp or a phone call, not a push notification

## Features

- **Track credit (उधार) and settlements (चुकता)** — add entries, record partial or full payments, see running balances per customer.
- **Overdue tracking** — a home-screen banner and per-customer indicators surface anyone whose payment is late, with one tap to adjust the due date.
- **Offline-first storage** — all data lives locally in SQLite first; the app is fully usable with zero connectivity.
- **Optional cloud backup & sync** — opt in during onboarding (or later from Settings) to mirror data to Firestore, so a shopkeeper can restore their book on a new phone.
- **Hindi / English throughout** — a context-driven i18n layer with persisted language choice, not just translated labels but locale-aware date/number formatting.
- **WhatsApp & call reminders** — one-tap WhatsApp messages (three templates: no due date, due today, overdue) and a direct dial-out, without UdharKitab ever sending anything on the shopkeeper's behalf.
- **Analytics dashboard** — outstanding totals, period-over-period comparison, monthly history, and a top-debtors list.
- **Google Sign-In** via Firebase Auth, with a guided onboarding flow (shop name → language → trial → optional cloud sync).
- **90-day free trial**, tracked both locally and in Firestore so it survives a reinstall.
- **UdharKitab Pro** — a fully custom paywall screen backed by RevenueCat for subscription purchases, restore, and entitlement checks.

## Tech Stack

| Layer             | Choice                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Framework         | [Expo](https://expo.dev) (SDK 54) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| UI runtime        | React 19 / React Native 0.81                                                                                       |
| Local storage     | `expo-sqlite` (async API)                                                                                          |
| Cloud sync & auth | Firebase (Firestore + Auth), Google Sign-In                                                                        |
| Subscriptions     | [RevenueCat](https://www.revenuecat.com/) (`react-native-purchases`)                                               |
| Animation         | `react-native-reanimated`                                                                                          |
| Icons             | `@expo/vector-icons`                                                                                               |

## Project Structure

```
udharkitab/
├── app/                      # Expo Router screens (file-based routing)
│   ├── onboarding/           # shop name → language → trial → cloud sync
│   ├── customer/[id].jsx     # single customer ledger
│   ├── index.jsx             # home
│   ├── pending.jsx           # "बाकी" — outstanding balances
│   ├── settings.jsx
│   ├── analytics.jsx
│   ├── paywall.jsx           # UdharKitab Pro screen
│   └── login.jsx / welcome.jsx
├── components/
│   ├── analytics/            # dashboard widgets
│   ├── onboarding/           # onboarding step primitives
│   └── ...                   # CustomerRow, EntryRow, PressableScale, etc.
├── constants/
│   ├── translations/         # en.js / hi.js / index.js
│   ├── colors.js
│   └── theme.js
├── contexts/                 # Language, Onboarding, Subscription
├── hooks/                    # useAuth, useCustomers, useAnalytics, ...
├── lib/                      # db.js (SQLite), cloudSync.js, firebase.js,
│                              # revenuecat.js, trial.js, whatsappTemplates.js
├── app.config.js             # Expo config (reads from .env)
└── eas.json                  # EAS Build profiles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`, no global install needed)
- A physical device with **Expo Go**, or an iOS/Android simulator
- (For native features like Google Sign-In / RevenueCat) an [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/) build — these don't work in plain Expo Go

### Installation

```bash
git clone https://github.com/vybex-dev/udharkitab.git
cd udharkitab
npm install
```

Create a `.env` file in the project root (see [Environment Variables](#environment-variables)), then:

```bash
npx expo start
```

Or run directly on a platform with a dev client:

```bash
npm run ios
npm run android
```

## Environment Variables

`app.config.js` reads these at build time via `dotenv`. Create a `.env` file in the project root:

```bash
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_URL_SCHEME=
```

You'll also need `google-services.json` (Android) in the project root — already present in this repo for the sample Firebase project; swap it for your own before shipping.

## RevenueCat Setup

The RevenueCat public SDK key currently lives directly in `lib/revenuecat.js`:

```js
export const REVENUECAT_API_KEY = "test_...";
```

To use your own project:

1. Create a project in the [RevenueCat dashboard](https://app.revenuecat.com/) and add your iOS/Android apps.
2. Create your products and attach them to an **Offering** (the app fetches the current offering's `monthly` package — see `getOfferings()` in `lib/revenuecat.js`).
3. Replace `REVENUECAT_API_KEY` with your own public SDK key.
4. The paywall (`app/paywall.jsx`) is a fully custom screen — it calls `purchase(packages.monthly)` directly rather than RevenueCat's hosted paywall UI, so no paywall template needs to be configured in the dashboard.
5. Entitlement checked across the app: `udhar_kitab_premium` (see `contexts/SubscriptionContext.jsx`).

## Firebase Setup

1. Create a Firebase project, enable **Authentication → Google**, and enable **Firestore**.
2. Download `google-services.json` (Android) and set the iOS/Web config values into `.env`.
3. Firestore data shape: `users/{uid}/customers/{customerId}` — one document per customer with entries/payments embedded (see `lib/cloudSync.js` for the full sync contract). Cloud sync is opt-in and always best-effort: local SQLite remains the source of truth on-device.

## Privacy Policy

Read the full policy at **[udharkitab.app/privacy](https://github.com/vybex-dev/udharkitab/blob/main/Privacy.md)**.

In-app, the policy renders natively at `app/privacy-policy.jsx` (content in `constants/privacyPolicyContent.js`) rather than opening a browser — linked from Settings and from the onboarding consent step.

## Scripts

| Command           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm start`       | Start the Expo dev server                          |
| `npm run android` | Build & run on a connected Android device/emulator |
| `npm run ios`     | Build & run on iOS simulator/device                |
| `npm run web`     | Run the web build                                  |

## Architecture Notes

- **Offline-first by design.** `lib/db.js` is the single source of truth for all reads/writes; `lib/cloudSync.js` is a one-way, best-effort mirror that never blocks or breaks a local write on failure.
- **i18n via context, not per-screen imports.** `contexts/LanguageContext.js` exposes the active translation table (`constants/translations/{en,hi}.js`) and persists the choice with AsyncStorage.
- **Subscription state is centralized** in `contexts/SubscriptionContext.jsx`, which wraps `lib/revenuecat.js` and exposes `isPremium`, `packages`, `purchase()`, and `restore()` to the rest of the app.
- **Trial state is dual-written** (Firestore + local SQLite `app_meta`) so a 90-day trial survives an offline period or a reinstall once the account is re-linked.

## Roadmap

- [ ] Customer Center integration for in-app subscription management
- [ ] Export ledger to PDF/CSV
- [ ] Reminder scheduling (beyond manual WhatsApp/call)
- [ ] Additional regional languages

## License

MIT — see [LICENSE](./LICENSE).
