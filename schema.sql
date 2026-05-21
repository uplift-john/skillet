-- ═══════════════════════════════════════════════════════════════
-- SKILLET — Supabase Schema (Stage 3.5)
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. USERS TABLE
-- Source of truth for identity is Clerk. This table holds app-level data.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  waitlist_joined_at timestamptz
);

-- 2. ROASTS TABLE
-- Every roast ever served, anonymous or authenticated.
create table if not exists public.roasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  anonymous_session_id text,
  ip_address text,
  input_text text not null,
  structured_answers jsonb not null,
  foolishness_score int,
  verdict_level int check (verdict_level between 1 and 5),
  verdict_text text,
  layers_revealed int not null default 1,
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  matched_scenario text
);

-- 3. MONTHLY USAGE TABLE
-- Denormalized counter for fast rate-limit checks on full roasts.
create table if not exists public.monthly_usage (
  user_id uuid not null references public.users(id),
  year_month text not null,
  full_roast_count int not null default 0,
  primary key (user_id, year_month)
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_roasts_user_created
  on public.roasts(user_id, created_at);

create index if not exists idx_roasts_anon_session
  on public.roasts(anonymous_session_id, created_at);

create index if not exists idx_roasts_verdict_level
  on public.roasts(verdict_level);

create index if not exists idx_monthly_usage_user_month
  on public.monthly_usage(user_id, year_month);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- All tables: RLS enabled, no policies for anon key.
-- Service role key (used in API routes) bypasses RLS.
-- This means the anon key cannot read or write any of these tables.
-- ═══════════════════════════════════════════════════════════════

alter table public.users enable row level security;
alter table public.roasts enable row level security;
alter table public.monthly_usage enable row level security;

-- No policies = anon key is fully blocked. Service role bypasses.

-- ═══════════════════════════════════════════════════════════════
-- RPC: increment_monthly_usage
-- Atomic upsert for the usage counter. Called from lib/usage.ts.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.increment_monthly_usage(
  p_user_id uuid,
  p_year_month text
)
returns int
language plpgsql
security definer
as $$
declare
  new_count int;
begin
  insert into public.monthly_usage (user_id, year_month, full_roast_count)
  values (p_user_id, p_year_month, 1)
  on conflict (user_id, year_month)
  do update set full_roast_count = monthly_usage.full_roast_count + 1
  returning full_roast_count into new_count;

  return new_count;
end;
$$;
