-- Reference copy of the live schema (Supabase project nrdqdgkotnuwnbrujrdu).
-- This file documents the schema for the repo; it is NOT run automatically.
-- Apply actual changes via Supabase migrations, then mirror them here.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'investor' check (role in ('investor','admin')),
  created_at timestamptz not null default now()
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.portfolio_members (
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ownership_pct numeric,
  primary key (portfolio_id, profile_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  project_name text not null,
  developer text,
  location text,
  unit_no text,
  unit_type text,
  bedrooms numeric,
  size_sqft numeric,           -- BUA
  plot_sqft numeric,
  purchase_date date,
  handover_date date,
  payment_plan text,
  unit_price_aed numeric not null default 0,        -- base price
  total_unit_price_aed numeric not null default 0,   -- price after offers/discounts
  total_paid_aed numeric not null default 0,
  total_pending_aed numeric not null default 0,
  status text default 'Under Construction',
  owner1_name text,
  owner2_name text,
  owner1_pct numeric,
  owner2_pct numeric,
  resale_noc_pct numeric,          -- % paid required before a resale NOC can be issued
  resale_applicable text,          -- 'YES' / 'NO'
  offer_notes text,
  remarks text,
  ppsf_plot numeric,               -- price per sqft on plot
  ppsf_bua numeric,                -- price per sqft on built-up area
  accelerated_payment_pct numeric,
  accelerated_payment_aed numeric,
  equity_construction_pct numeric, -- payment plan split: during construction
  equity_handover_pct numeric,     -- on handover
  equity_posthandover_pct numeric, -- post-handover
  equity_construction_aed numeric,
  equity_handover_aed numeric,
  equity_posthandover_aed numeric,
  created_at timestamptz not null default now()
);

create table public.payment_milestones (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  milestone_no numeric,
  milestone_event text,
  installment_code text,
  sale_date date,
  due_date date,          -- null = "Undecided" in the UI
  pct numeric,
  amount_aed numeric not null default 0,
  vat_aed numeric not null default 0,
  total_aed numeric not null default 0,
  paid_aed numeric not null default 0,
  outstanding_aed numeric not null default 0,
  status text default 'Pending',   -- 'Paid' | 'Pending' — combined with due_date to
                                    -- derive the 5 UI states: Paid / Overdue / Due soon
                                    -- (<=30d) / Upcoming (30-90d+) / Undecided (no date)
  year int,
  remarks text
);

create table public.fx_rates (
  id int primary key default 1,
  aed_to_inr numeric not null,
  as_of date not null,
  constraint single_row check (id = 1)
);

-- Indexes
create index on public.properties (portfolio_id);
create index on public.payment_milestones (property_id);
create index on public.portfolio_members (profile_id);

-- SECURITY DEFINER helpers (EXECUTE revoked from anon; used only inside RLS policies)
-- is_admin(): true if the calling user's profile has role = 'admin'
-- my_portfolio_ids(): portfolio_ids the calling user belongs to (via portfolio_members)
-- handle_new_user(): trigger on auth.users insert -> creates a matching public.profiles row

-- Row Level Security policies (rls_enabled = true on every table above):
--   profiles:            read own profile or admin reads all; update own profile
--   portfolios:           read own portfolios or admin reads all
--   portfolio_members:    read own membership or admin reads all
--   properties:            read own properties or admin reads all
--   payment_milestones:    read own milestones or admin reads all
--   fx_rates:              any authenticated user can read
-- No insert/update/delete policies exist for investors — all writes are done by an
-- operator via the Supabase dashboard / MCP tools, not by the app itself.
