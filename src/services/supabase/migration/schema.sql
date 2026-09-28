-- ============================================================================
-- Spendly — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) once, then add
-- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per user, mirrors <Settings> in the app
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text,
  display_name    text,
  currency        text not null default 'USD',
  locale          text not null default 'en-US',
  week_starts_on  smallint not null default 1 check (week_starts_on in (0, 1)),
  reminders       jsonb not null default
    '{"dailyLogging": true, "budgetAlerts": true, "goalUpdates": true}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id             text primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  category       text not null default 'other',
  type           text not null check (type in ('income', 'expense')),
  amount         numeric(14, 2) not null check (amount > 0),
  date           date not null,
  payment_method text not null default 'debit_card',
  note           text not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category);

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 80),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  saved_amount  numeric(14, 2) not null default 0 check (saved_amount >= 0),
  target_date   date,
  color         text not null default 'green'
    check (color in ('green', 'purple', 'yellow', 'red', 'blue')),
  note          text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id);

-- ---------------------------------------------------------------------------
-- budgets: a monthly limit per category ('overall' caps all expenses)
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id       text primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  category text not null default 'overall',
  amount   numeric(14, 2) not null check (amount > 0),
  unique (user_id, category)
);

-- ---------------------------------------------------------------------------
-- notifications: in-app reminders and alerts
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  body       text not null default '',
  tone       text not null default 'info'
    check (tone in ('info', 'success', 'warning', 'danger')),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security: every table is private to its owner
-- ---------------------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'transactions', 'goals', 'budgets', 'notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "%s_owner_access" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_owner_access" on public.%I for all using (auth.uid() = %s) with check (auth.uid() = %s)',
      table_name, table_name,
      case when table_name = 'profiles' then 'id' else 'user_id' end,
      case when table_name = 'profiles' then 'id' else 'user_id' end
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Create a profile automatically when a user signs up with Google
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(excluded.display_name, ''), profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep `updated_at` honest on profiles.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();
