# Ledger — off-plan real estate portfolio tracker

A mobile-optimized, multi-tenant web app for tracking off-plan and ready real estate
investments across multiple investor families. Each investor logs in and only ever
sees their own portfolio; an agency admin account can switch between all clients.

- **Frontend**: a single static `index.html` (no build step) — vanilla JS, talks
  directly to Supabase from the browser.
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth), with Row-Level
  Security enforcing per-investor data isolation at the database level.
- **Hosting**: deployed on [Vercel](https://vercel.com), auto-deployed from the
  `main` branch of this repo.

## Deploying changes

Push to `main` — Vercel's GitHub integration builds and deploys automatically.
There is no build step; `index.html` is served as-is.

## Data model

See `supabase/schema.sql` for the current schema (profiles, portfolios,
portfolio_members, properties, payment_milestones, fx_rates), plus RLS policies.
Schema changes are applied directly via Supabase migrations and should be mirrored
into that file for reference.

## Demo logins

- Investor (Shukla Family): `shukla.family.demo@example.com` / `ShuklaPortfolio#2026!`
- Agency admin (all clients): `ishlokchavan@gmail.com` / `Portfolio#Admin2026!`
