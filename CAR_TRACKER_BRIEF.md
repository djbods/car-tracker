# Car Tracker — Platform Expansion Brief

## Project Overview

The E39 Garage Tracker is a mobile-first PWA for logging modifications, service history, and spending on a BMW E39. Currently deployed at [e39-tracker.netlify.app](https://e39-tracker.netlify.app) from the `djbods/car-tracker` GitHub repo. Storage is currently handled via **supabase**.

The goal of this project is to evolve the app into a **generalised, multi-platform car tracker SaaS** — with E39 as the first supported platform — capable of supporting paying users across multiple vehicles and platforms in the future.

---

## Architecture Decision

**We are choosing Option B: build the generalised platform from scratch.**

- The app will be designed platform-agnostic from day one
- The BMW E39 will be the first supported "platform/model"
- The existing app's UI patterns and data structures should inform (not constrain) the new build
- Do not retrofit the old codebase — start fresh with the new architecture, referencing the existing app for feature parity

---

## Tech Stack

| Concern | Choice |
|---|---|
| Frontend | React (PWA) |
| Auth | Supabase Auth |
| Database | Supabase (Postgres) — replaces IndexedDB |
| Payments | Stripe (integrate later — stub out for now) |
| Hosting | Netlify (existing) or Vercel |
| Styling | Tailwind CSS |

---

## Phase 1 Goals (Current Sprint)

> **Priority: Cloud Sync + Multi-Device Support**

This is the single most important unlock for a paid product. A user's garage data must follow them across devices and survive a browser wipe.

### 1.1 — Supabase Project Setup
- [x] Initialise a new Supabase project
- [x] Define the core database schema (see below)
- [x] Enable Row Level Security (RLS) on all tables — users can only read/write their own data
- [x] Store Supabase `url` and `anon key` in environment variables (`.env.local`, never committed)

### 1.2 — Authentication
- [x] Implement Supabase Auth
- [x] Support email/password signup and login to start
- [x] Add a simple auth flow: Login page → Dashboard
- [x] Protect all app routes — unauthenticated users are redirected to login
- [x] Show logged-in user's email in the UI header with a logout option

### 1.3 — Database Schema

Design the schema to be **platform-agnostic** from the start. The `vehicles` table should support any car, not just E39s.

```sql
-- Users are handled by Supabase Auth (auth.users)

-- Vehicles table
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nickname text not null,               -- e.g. "The Titan"
  make text not null,                   -- e.g. "BMW"
  model text not null,                  -- e.g. "E39 530i"
  year integer,
  variant text,                         -- e.g. "M Sport"
  colour text,
  vin text,
  notes text,
  created_at timestamptz default now()
);

-- Service / maintenance log
create table service_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  title text not null,                  -- e.g. "Oil & Filter Change"
  description text,
  odometer integer,                     -- km at time of service
  cost numeric(10, 2),
  currency text default 'AUD',
  workshop text,                        -- who did the work
  created_at timestamptz default now()
);

-- Modifications log
create table mod_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  title text not null,                  -- e.g. "H&R Sport Springs"
  category text,                        -- e.g. "Suspension", "Interior", "Engine"
  description text,
  cost numeric(10, 2),
  currency text default 'AUD',
  supplier text,
  installed_by text,                    -- "Self" or workshop name
  created_at timestamptz default now()
);

-- Expenses (catch-all: insurance, rego, tyres, fuel, etc.)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  category text not null,              -- e.g. "Insurance", "Registration", "Fuel"
  description text,
  amount numeric(10, 2),
  currency text default 'AUD',
  created_at timestamptz default now()
);
```

Apply RLS policies on all four tables:
```sql
-- Example for vehicles (repeat pattern for all tables)
alter table vehicles enable row level security;

create policy "Users can manage their own vehicles"
  on vehicles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 1.4 — Data Layer / API Hooks
- [x] Replace all IndexedDB reads/writes with Supabase client calls
- [x] Create reusable hooks or service functions for each table (e.g. `useVehicles`, `useServiceLogs`)
- [x] Handle loading and error states throughout
- [x] Implement **optimistic UI** where appropriate — don't make the user wait for a network round trip on simple adds

### 1.5 — Multi-Device Behaviour
- [x] On login, fetch all data from Supabase — the app should look identical on any device
- [x] If a user adds an entry on mobile, it should appear immediately on desktop on next load (no manual sync required)
- [x] No offline-first requirement at this stage — online-required is acceptable for v1

### 1.6 — Vehicle Selector
- [x] A user can have **multiple vehicles** in their garage
- [x] The app should have a "My Garage" view listing all their vehicles
- [x] All logs (service, mods, expenses) are scoped to the selected vehicle
- [x] Add vehicle form should capture: nickname, make, model, year, variant, colour (all optional except nickname + make + model)

---

## Phase 2 Goals (Next Sprint)

### 2.1 — Structured mod entry (UX compromise)

Driven by user feedback: free-text mod titles are friction, but strict curated dropdowns slow down the enthusiast audience and pull Phase 3 platform-awareness forward. The middle path is structured **category** (fixed list) + **smart-suggest brand** (autocomplete that learns from prior entries, free-text fallback always available).

**Branch A — `feature/mod-category-dropdown`**
- [x] Add `category` `<select>` to the add-entry modal, visible only when type = `mod`
- [x] Category options: Suspension, Exhaust, Wheels & Tyres, Interior, Engine, Brakes, Drivetrain, Electronics, Cosmetic / Exterior, Other
- [x] Persist `category` to `mod_logs.category` (column already exists in schema)
- [x] Surface category on the entry detail modal for mods
- [x] Default to empty (no forced pick) so it stays optional

**Branch B — `feature/mod-brand-autocomplete`**
- [x] Combobox component for brand/product on mod entries (datalist-based or custom)
- [x] Suggest values from the user's own prior `mod_logs.title` entries, scoped per category
- [x] Free-text entry always accepted ("Other / custom" never blocks save)
- [x] No curated brand list, no scraping, no external API — suggestions grow organically from usage

### 2.2 — Spend analytics (v1)

Turns the Spend tab from a static lifetime total into an actively useful, visual view. Direct payoff for the category work shipped in 2.1 — finally answers "where is the money actually going."

- [x] Time-scope segmented control: This year (default) / Last 30 days / All time
- [x] All spend numbers, breakdowns, charts and the transactions list react to scope
- [x] Stacked horizontal bar visualising the Mods / Service / Repairs proportion (existing accent colours)
- [x] Per-category breakdown for mods — sorted by spend desc, with percentage of mod total and a bar scaled to the leading category
- [x] "Biggest mod" callout card (single most expensive mod entry in scope)
- [x] Garage-card lifetime stats (mods count, total invested) stay all-time — scope only affects the Spend screen

**Deferred to v2:** monthly trend chart, cost-per-km, cross-vehicle comparison, CSV/PDF export of the current scope (rolled into the broader Export item below).

### 2.3 — Schema hardening

Small foundational migration. Ship first — unblocks every section below.

- [x] `vehicles`: add `status` (`'active' | 'sold' | 'archived'`, default `'active'`), `sold_date` (date, nullable), `sold_price` (numeric, nullable), `combined_cycle_consumption` (numeric, L/100km, nullable — manufacturer claim used to anchor the fuel gauge in 2.4)
- [x] Sold vehicles remain visible in My Garage, visually distinct and read-only — preserves full ownership history
- [x] `expenses.category`: convert from free-text to a controlled vocabulary — Insurance, Registration, Tyres, Parking, Toll, Cleaning, Roadside, Detailing, Other (Fuel moves to its own table in 2.4)
- [x] Data migration: map existing free-text values where possible, dump the rest to `Other` with the original text preserved in `description`

### 2.4 — Fuel log + economy gauge

The headline visual feature. Daily-use driver, screenshot-worthy.

- [x] New `fuel_logs` table: `vehicle_id`, `user_id`, `date`, `odometer`, `litres`, `total_cost`, `currency`, `station` (nullable), `is_full_tank` (bool default true), `notes`
- [x] L/100km computed between consecutive full-tank entries — partial fills counted in spend but skipped from economy calc
- [x] Tacho-style gauge on the vehicle dashboard — needle sweeping an amber → green → red gradient, analog feel
- [x] **Default anchor:** user's own rolling average across the last 10 full tanks (zero setup, works on any car)
- [x] **Override anchor:** if `vehicles.combined_cycle_consumption` is set, anchor the green band to the manufacturer claim — answers "am I beating spec?"
- [x] Fuel entries feed the Spend tab automatically (subsume the current Fuel expense category)

### 2.5 — Document vault

Supersedes the original "Photo attachments" bullet — broader and more valuable.

- [ ] Supabase Storage bucket with per-user RLS scoping
- [ ] New `documents` table: `vehicle_id`, `user_id`, `type` (Insurance / Registration / Roadworthy / Warranty / Manual / Receipt / Other), `title`, `file_path`, `expiry_date` (date, nullable), `notes`, `created_at`
- [ ] Per-vehicle Documents tab — upload, inline preview (image + PDF), download
- [ ] `expiry_date` feeds the reminder surface in 2.6 — "Insurance expires in 14 days"
- [ ] Photo attachments on service / mod logs remain in scope but reuse the same storage bucket

### 2.6 — Service intervals + reminders

User-defined intervals to start. Per-platform defaults are deferred to Phase 3 alongside the curated brand list (same curation burden, ship together).

- [ ] New `service_intervals` table: `vehicle_id`, `user_id`, `title` (e.g. "Engine oil"), `interval_km` (nullable), `interval_months` (nullable — either or both can be set), `last_done_at` (date), `last_done_odometer` (auto-updates when a matching `service_log` is added)
- [ ] User adds intervals manually — no platform-specific defaults at this stage
- [ ] Dashboard "Up next" card: "Engine oil — due in 820 km" / "Roadworthy — overdue by 2 months"
- [ ] Date-based reminders also surfaced from `documents.expiry_date`
- [ ] PWA push notifications deferred — in-app bell + dashboard card to start

### 2.7 — Data export

- [ ] **Excel export (headline):** multi-sheet `.xlsx` — Summary, Vehicles, Service, Mods, Expenses, Fuel, Documents (link list). Generated client-side (SheetJS or exceljs, no backend cost)
- [ ] **JSON export:** full structured dump of the user's data, designed for future round-trip import — positioned as the "back up / move providers" feature
- [ ] Scoped to the currently selected vehicle by default, with an "All vehicles" option
- [ ] **PDF export** (the original pre-sale handover report) remains in scope but is now downstream of the Excel work — same data pipeline, different layout

### Other Phase 2 items (not yet scheduled)

- **Stripe payments** — free tier (1 vehicle, no export, no document vault) vs paid tier (unlimited vehicles, Excel/JSON/PDF export, document vault, reminders)
- *(Photo attachments rolled into 2.5; PDF export rolled into 2.7; Reminders rolled into 2.6.)*

---

## Phase 3 Goals (Future — do not build yet)

- **Multi-platform expansion** — onboarding flow that lets users specify any make/model, not just E39
- **Community layer** — public build profiles, browse other users' builds
- **Platform-specific defaults** — pre-populated common service intervals (auto-fill "engine oil every 10,000 km" when a BMW is added — the smart layer on top of user-defined intervals from 2.6) and mod categories per model
- **Curated brand lists per platform** — once platform-awareness lands, layer curated popular-brand suggestions on top of the organic autocomplete from Phase 2.1 (deferred from Dad's original suggestion; doing it sooner would mean per-platform curation + maintenance burden). Ship together with platform-specific service-interval defaults — same curation work

---

## Notes for Claude Code

- Mobile-first layout throughout — this is primarily used in the garage on a phone
- Dark theme preferred (consistent with existing app aesthetic)
- Keep the UI tight and unsentimental — this is a tool, not a showroom
- Prioritise getting Phase 1 fully working and stable before any Phase 2 work begins
- The existing app at `jackbodsworth/e39-garage` can be referenced for data structures and UI patterns, but do not copy-paste from it wholesale — the new architecture is a clean break
- Commit frequently with clear messages scoped to the feature being built
