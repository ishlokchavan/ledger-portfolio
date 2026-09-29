# Ledger (mobile)

The native iOS/Android counterpart to the web app in the repo root, built with
[Expo](https://expo.dev) + React Native + TypeScript. It talks to the same
Supabase project (auth + RLS-scoped data) as `index.html`, so a login works
in both.

## Stack

- **Expo SDK 57**, React Native 0.86, TypeScript (strict mode)
- **@react-navigation** — bottom tabs (Overview / Properties / Payments / Account)
  + a native stack for the Properties → Property Detail push
- **@supabase/supabase-js**, session persisted via `@react-native-async-storage/async-storage`
- **react-native-svg** for the icon set (ported 1:1 from the web app's inline SVGs)
- No UI kit — plain `StyleSheet` components themed from `src/theme/theme.ts`,
  same color tokens as the web app's CSS custom properties (light default,
  dark switcher in Account, matching `[data-theme]` behavior)

## Project layout

```
App.tsx                     — providers (theme, data) + navigator root
src/
  types.ts                  — Property / PaymentMilestone / Profile / Portfolio etc.
  lib/
    supabase.ts              — Supabase client (AsyncStorage-backed session)
    format.ts                — fmtMoney/fmtDate/daysUntil/milestoneState/resaleEligibility
                                (ported 1:1 from the web app's business logic)
  theme/
    theme.ts                 — light/dark color tokens
    ThemeContext.tsx          — theme state, persisted to AsyncStorage
  context/
    AppDataContext.tsx        — session/profile/portfolios/properties/milestones/fx loading
  navigation/
    AppNavigator.tsx           — root: boot spinner → Login or bottom tabs
    PropertiesStackNavigator.tsx
    types.ts
  components/
    Icon.tsx, Screen.tsx, TopBar.tsx, UI.tsx (Card/Pill/ProgressBar/EmptyNote),
    PropertyCard.tsx, PayRow.tsx
  screens/
    LoginScreen.tsx, DashboardScreen.tsx, PropertiesScreen.tsx,
    PropertyDetailScreen.tsx (sheet-style horizontally-scrollable milestone table),
    PaymentsScreen.tsx (status tabs + year period filter), AccountScreen.tsx
```

## Feature parity with the web app

- Light theme by default, with a Light/Dark switcher under Account
- 5-state payment status (Paid / Overdue / Due soon ≤30d / Upcoming / Undecided)
- Resale-readiness badge + detail panel
- Payments screen: scrollable status tabs with live counts, plus a year period filter
- Property detail: full pricing/payment-structure/resale facts, and a sheet-style
  payment-schedule table (Sr No, Milestone, Sale/Due date, Installment, %, Amount,
  VAT, Total, Paid, Outstanding, Year, Status, Remarks) with a totals row, scrollable
  horizontally without moving the page
- Admin accounts get a portfolio switcher in the top bar; investors see their
  single portfolio's name

## Running it

```bash
cd mobile
npm install

npm run ios       # iOS Simulator (macOS + Xcode required)
npm run android    # Android emulator / device (Android Studio required)
npm start          # Metro bundler — scan the QR code with Expo Go on a physical phone
```

No native build step is required to try it on a device — the app runs fine
inside **Expo Go** for development. A production build (App Store / Play
Store) goes through [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build --platform ios       # or --platform android, or --platform all
```

`app.json` already sets bundle identifiers (`com.ledgerportfolio.app` for
both iOS and Android) — change these before your first EAS build if you want
your own.

## Demo logins

Same Supabase project as the web app:

- Investor (Shukla Family): `shukla.family.demo@example.com` / `ShuklaPortfolio#2026!`
- Agency admin (all clients): `ishlokchavan@gmail.com` / `Portfolio#Admin2026!`

## Getting it onto your iPhone via TestFlight (no laptop needed afterwards)

Expo Go needs a laptop running the dev server. A TestFlight build is a real, standalone
app that lives on your phone. One-time setup, from a computer:

1. Enrol in the [Apple Developer Program](https://developer.apple.com/programs/) (paid, yearly).
2. In App Store Connect, create an app record whose Bundle ID matches `ios.bundleIdentifier`
   in `app.json` (`com.ledgerportfolio.app` — bundle IDs are globally unique, so change it
   here first if Apple says it is taken).
3. From `mobile/`:
   ```bash
   npm install -g eas-cli
   eas login                 # Expo account (free)
   eas build:configure       # first time only
   npm run build:ios         # cloud build; asks for your Apple login/2FA and creates signing certs
   npm run submit:ios        # uploads the finished build to App Store Connect / TestFlight
   ```
4. In App Store Connect → TestFlight, add yourself as an internal tester, then install the
   **TestFlight** app on your iPhone and accept the invite. The first build takes Apple a
   few minutes to process.

Every later update is `npm run build:ios && npm run submit:ios` again (build numbers
auto-increment). The web app needs none of this — it deploys from `main` on Vercel and can
be added to an iPhone home screen from Safari (Share → Add to Home Screen).
