# E39 Garage Tracker — Platform Expansion Brief

## Project Overview

The E39 Garage Tracker is a mobile-first PWA for logging modifications, service history, and spending on a BMW E39. Currently deployed at [e39-tracker.netlify.app](https://e39-tracker.netlify.app) from the `jackbodsworth/e39-garage` GitHub repo. Storage is currently handled via **IndexedDB** (local, browser-bound).

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
- [ ] Initialise a new Supabase project
- [ ] Define the core database schema (see below)
- [ ] Enable Row Level Security (RLS) on all tables — users can only read/write their own data
- [ ] Store Supabase `url` and `anon key` in environment variables (`.env.local`, never committed)

### 1.2 — Authentication
- [ ] Implement Supabase Auth
- [ ] Support email/password signup and login to start
- [ ] Add a simple auth flow: Login page → Dashboard
- [ ] Protect all app routes — unauthenticated users are redirected to login
- [ ] Show logged-in user's email in the UI header with a logout option

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
- [ ] Replace all IndexedDB reads/writes with Supabase client calls
- [ ] Create reusable hooks or service functions for each table (e.g. `useVehicles`, `useServiceLogs`)
- [ ] Handle loading and error states throughout
- [ ] Implement **optimistic UI** where appropriate — don't make the user wait for a network round trip on simple adds

### 1.5 — Multi-Device Behaviour
- [ ] On login, fetch all data from Supabase — the app should look identical on any device
- [ ] If a user adds an entry on mobile, it should appear immediately on desktop on next load (no manual sync required)
- [ ] No offline-first requirement at this stage — online-required is acceptable for v1

### 1.6 — Vehicle Selector
- [ ] A user can have **multiple vehicles** in their garage
- [ ] The app should have a "My Garage" view listing all their vehicles
- [ ] All logs (service, mods, expenses) are scoped to the selected vehicle
- [ ] Add vehicle form should capture: nickname, make, model, year, variant, colour (all optional except nickname + make + model)

---

## Phase 2 Goals (Next Sprint — do not build yet)

Listed here for architectural awareness — do not implement, but don't make decisions in Phase 1 that would make these harder.

- **Photo attachments** — attach images to service logs and mod entries (Supabase Storage)
- **PDF export** — generate a full service/mod history report (key feature for pre-sale use)
- **Reminders** — service interval reminders, rego/insurance due dates
- **Spend analytics** — cost over time, by category, per vehicle
- **Stripe payments** — free tier (1 vehicle, no export) vs paid tier (unlimited vehicles, PDF export, reminders)

---

## Phase 3 Goals (Future — do not build yet)

- **Multi-platform expansion** — onboarding flow that lets users specify any make/model, not just E39
- **Community layer** — public build profiles, browse other users' builds
- **Platform-specific defaults** — pre-populated common service intervals and mod categories per model

---

## Notes for Claude Code

- Mobile-first layout throughout — this is primarily used in the garage on a phone
- Dark theme preferred (consistent with existing app aesthetic)
- Keep the UI tight and unsentimental — this is a tool, not a showroom
- Prioritise getting Phase 1 fully working and stable before any Phase 2 work begins
- The existing app at `jackbodsworth/e39-garage` can be referenced for data structures and UI patterns, but do not copy-paste from it wholesale — the new architecture is a clean break
- Commit frequently with clear messages scoped to the feature being built
