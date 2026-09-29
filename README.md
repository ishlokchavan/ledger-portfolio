# Ledger — off-plan real estate portfolio tracker

A multi-tenant tracker for off-plan and ready real estate investments across multiple
investor families, shipped as both a web app and a native iOS/Android app. Each
investor logs in and only ever sees their own portfolio; an agency admin account can
switch between all clients.

- **Web** (`index.html`, this directory): a single static file (no build step) —
  vanilla JS, talks directly to Supabase from the browser. Deployed on
  [Vercel](https://vercel.com), auto-deployed from the `main` branch of this repo.
- **Mobile** (`mobile/`): an [Expo](https://expo.dev) + React Native + TypeScript app
  for iOS and Android, talking to the same Supabase project. See `mobile/README.md`
  for how to run it. Not deployed to Vercel — it ships through the App Store / Play
  Store (or Expo Go for development) via EAS Build.
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth), with Row-Level
  Security enforcing per-investor data isolation at the database level, shared by
  both frontends.

## UX at a glance

Both apps share one design language (teal accent, Fraunces / Inter / IBM Plex Mono on web,
same tokens on native): Overview with a progress hero, next-payment spotlight and
needs-attention feed; Properties with search, filters and sorting; Payments with
per-status totals, search and month grouping; light / dark / auto themes; AED / INR
switching from the top bar. The web app additionally has a desktop sidebar layout, hash
routes (deep links + back button), a 12-month payment forecast, a command palette
(`Ctrl/Cmd+K`), keyboard shortcuts (`g o`, `g p`, `g y`, `h`, `c`), a "hide amounts"
privacy mode, and CSV export of payments.

## Install as an app (PWA)

The web app is a Progressive Web App: open the live URL on your phone, then

- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** menu → **Install app** (or use *Install* in Account)
- **Desktop Chrome/Edge:** the install icon in the address bar

It then opens full-screen with its own icon, and the app shell loads instantly and works
offline (portfolio figures always come live from Supabase, so they need a connection).
Pieces: `manifest.webmanifest`, `sw.js` (service worker — bump `VERSION` to force a cache
refresh), `icons/`, and `vendor/supabase.js` (Supabase JS is bundled locally rather than
loaded from a CDN so the shell works offline). In installed mode there is a refresh button
and pull-to-refresh, since there is no browser reload.

## Deploying changes

**Web**: push to `main` — Vercel's GitHub integration builds and deploys
automatically. There is no build step; `index.html` is served as-is.

**Mobile**: see `mobile/README.md` — run in Expo Go for development, or build with
`eas build` for a store release.

## Data model

See `supabase/schema.sql` for the current schema (profiles, portfolios,
portfolio_members, properties, payment_milestones, fx_rates), plus RLS policies.
Schema changes are applied directly via Supabase migrations and should be mirrored
into that file for reference.

## Demo logins

- Investor (Shukla Family): `shukla.family.demo@example.com` / `ShuklaPortfolio#2026!`
- Agency admin (all clients): `ishlokchavan@gmail.com` / `Portfolio#Admin2026!`
