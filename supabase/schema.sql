-- E39 Garage Tracker — Phase 1 schema
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotent: safe to re-run during early development.

-- ──────────────────────────────────────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists vehicles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nickname    text not null,
  make        text not null,
  model       text not null,
  year        integer,
  variant     text,
  colour      text,
  vin         text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists service_logs (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  title       text not null,
  description text,
  odometer    integer,
  cost        numeric(10, 2),
  currency    text default 'AUD',
  workshop    text,
  created_at  timestamptz not null default now()
);

create table if not exists mod_logs (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references vehicles(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  title        text not null,
  category     text,
  description  text,
  cost         numeric(10, 2),
  currency     text default 'AUD',
  supplier     text,
  installed_by text,
  created_at   timestamptz not null default now()
);

create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  category    text not null,
  description text,
  amount      numeric(10, 2),
  currency    text default 'AUD',
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- Indexes — speed up the common "all rows for this vehicle, newest first"
-- ──────────────────────────────────────────────────────────────────────────

create index if not exists service_logs_vehicle_date_idx on service_logs (vehicle_id, date desc);
create index if not exists mod_logs_vehicle_date_idx     on mod_logs     (vehicle_id, date desc);
create index if not exists expenses_vehicle_date_idx     on expenses     (vehicle_id, date desc);

-- ──────────────────────────────────────────────────────────────────────────
-- Row Level Security — every table is private per user
-- ──────────────────────────────────────────────────────────────────────────

alter table vehicles      enable row level security;
alter table service_logs  enable row level security;
alter table mod_logs      enable row level security;
alter table expenses      enable row level security;

drop policy if exists "Users can manage their own vehicles"     on vehicles;
drop policy if exists "Users can manage their own service logs" on service_logs;
drop policy if exists "Users can manage their own mod logs"     on mod_logs;
drop policy if exists "Users can manage their own expenses"     on expenses;

create policy "Users can manage their own vehicles"
  on vehicles for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own service logs"
  on service_logs for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own mod logs"
  on mod_logs for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own expenses"
  on expenses for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
