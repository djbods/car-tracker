-- Car Tracker — Phase 2.4: fuel logs
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- fuel_logs
-- ──────────────────────────────────────────────────────────────────────────
-- A single fill-up. `is_full_tank` toggles whether this entry closes a tank
-- cycle (used by the L/100km calc — partials are counted in spend but skipped
-- as boundaries). Cost is captured here so the Spend tab can subsume the old
-- "Fuel" expense category (which was removed from the vocab in 2.3).

create table if not exists fuel_logs (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references vehicles(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  odometer     integer not null,
  litres       numeric(7, 2) not null,
  total_cost   numeric(10, 2),
  currency     text default 'AUD',
  station      text,
  is_full_tank boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now()
);

-- Date for the transactions list, odometer for the economy calc which walks
-- entries in odometer order to pair consecutive full tanks.
create index if not exists fuel_logs_vehicle_date_idx on fuel_logs (vehicle_id, date desc);
create index if not exists fuel_logs_vehicle_odo_idx  on fuel_logs (vehicle_id, odometer asc);

alter table fuel_logs enable row level security;

drop policy if exists "Users can manage their own fuel logs" on fuel_logs;
create policy "Users can manage their own fuel logs"
  on fuel_logs for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
