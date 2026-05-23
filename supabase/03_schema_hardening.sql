-- Car Tracker — Phase 2.3: schema hardening
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- Vehicle lifecycle + manufacturer fuel claim
-- ──────────────────────────────────────────────────────────────────────────
-- `status` lets a vehicle be sold or archived without losing its history.
-- `sold_date` / `sold_price` capture the handover (used by the pre-sale PDF
-- export later and the lifetime-spend ROI math).
-- `combined_cycle_consumption` is the manufacturer's claimed L/100km — used
-- as an optional anchor for the fuel-economy gauge in 2.4. When NULL the
-- gauge falls back to the user's own rolling average.

alter table vehicles
  add column if not exists status                     text    not null default 'active',
  add column if not exists sold_date                  date,
  add column if not exists sold_price                 numeric(10, 2),
  add column if not exists combined_cycle_consumption numeric(5, 2);

do $$ begin
  alter table vehicles
    add constraint vehicles_status_check check (status in ('active', 'sold', 'archived'));
exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Expense category vocabulary
-- ──────────────────────────────────────────────────────────────────────────
-- The original schema accepted any free-text category, which would have
-- fragmented spend analytics (e.g. "Rego" vs "Registration" vs "rego").
-- Lock it down before fuel lands in 2.4 and the table starts getting rows.
-- Fuel is intentionally NOT on this list — it moves to its own table in 2.4
-- so we can capture litres + odometer alongside the cost.

do $$ begin
  alter table expenses
    add constraint expenses_category_check check (category in (
      'Insurance',
      'Registration',
      'Tyres',
      'Parking',
      'Toll',
      'Cleaning',
      'Roadside',
      'Detailing',
      'Other'
    ));
exception when duplicate_object then null; end $$;
