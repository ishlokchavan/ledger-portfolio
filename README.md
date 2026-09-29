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
