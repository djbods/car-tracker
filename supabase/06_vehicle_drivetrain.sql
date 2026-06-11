-- Car Tracker — Phase 2: vehicle drivetrain detail
-- Paste into Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- Fuel / drivetrain / transmission
-- ──────────────────────────────────────────────────────────────────────────
-- Optional descriptive fields that power the spec pills on the car card
-- (e.g. "Petrol · Rear-Wheel Drive · Manual"). Free text — the app supplies a
-- fixed picklist in the UI, but we don't constrain at the DB level so unusual
-- combinations (e.g. classic "4-speed", "LPG") aren't blocked. All nullable;
-- a car with none set simply renders fewer pills.

alter table vehicles
  add column if not exists fuel_type    text,
  add column if not exists drivetrain   text,
  add column if not exists transmission text;
