# Car Tracker — CLAUDE.md

## What this is
Multi-platform car tracker SaaS (PWA). BMW E39 is the first supported vehicle. Built platform-agnostic from day one — any make/model will be supportable. Clean-break rewrite; do not copy from the old repo (`jackbodsworth/e39-garage`), reference it only for feature parity.

## Tech stack
- **Frontend:** React (PWA), Tailwind CSS
- **Auth:** Supabase Auth (email/password)
- **Database:** Supabase (Postgres) with Row Level Security on all tables
- **Payments:** Stripe — stub out only, do not implement yet
- **Hosting:** Netlify or Vercel
- **Env vars:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`, never committed

## Database schema (source of truth)
Four tables: `vehicles`, `service_logs`, `mod_logs`, `expenses`. All have `user_id` referencing `auth.users`. RLS enabled on all — users can only read/write their own rows. `fuel_logs` and `documents` tables are in Phase 2.

## Architecture rules
- All data reads/writes go through Supabase client — no IndexedDB
- Use reusable hooks per table: `useVehicles`, `useServiceLogs`, `useMods`, `useExpenses`
- Optimistic UI on simple add/edit operations — don't make the user wait on network
- All logs are scoped to the currently selected vehicle
- Multi-vehicle support from day one — users can have a full garage

## Current phase
**Phase 1 is complete.** Phase 2 is active. Do not build Phase 3.

### Phase 2 remaining work (incomplete items only)
- `documents.expiry_date` feeding reminder surface ("Insurance expires in 14 days")
- Photo attachments on service/mod logs (reuse same Supabase storage bucket)
- `service_intervals` table + "Up next" dashboard card + date-based reminders from `documents.expiry_date`
- PWA push notifications deferred — in-app bell only for now
- Excel export (SheetJS/exceljs, client-side, multi-sheet), JSON export, PDF export
- Stripe integration (wire up close to launch — stub for now)
- Tier enforcement via feature flags driven by subscription status
- Beta grandfathering logic

### Tiering (enforce in app, Stripe wires up later)
| Tier | What's included |
|---|---|
| Free | 1 vehicle; service/mod/expense logs; fuel log + economy gauge; spend analytics |
| Paid (~$5–8 AUD/mo) | Unlimited vehicles; document vault; reminders; Excel/JSON/PDF export; full analytics |

### Beta launch checklist (can ship alongside Phase 2)
- Per-user storage caps (~50MB free / ~1GB paid)
- Error logging (Sentry free tier)
- Basic usage telemetry (signups, DAU, feature usage)
- Privacy & terms pages (MVP versions)
- Confirm Supabase auth rate limiting is on in production

## UI conventions
- Mobile-first throughout — primary use is on a phone in the garage
- Dark theme
- Tight, utilitarian UI — a tool, not a showroom
- Existing accent colours: amber/green/red gradient (used on fuel gauge), plus app accent colours from existing build

## Onboarding & First Impressions (Critical for landing page & new users)
**Highest priority polish item** — The current live version feels very BMW/E39-centric, which risks confusing visitors about the general-purpose nature of the app.

**Landing / First-load experience:**
- Clearly state on the hero/landing: “Track any car — 40+ manufacturers supported with official emblems & logos”
- Show a small carousel or grid of example vehicles from different brands (BMW E39, Honda Civic, Ford Mustang, Porsche, Tesla, etc.) so users instantly understand the breadth.
- Neutral or rotating demo state instead of hard-coded E39 data.

**Onboarding flow for new users:**
- Clean “Add your first car” wizard on first launch / empty state.
- Prominent manufacturer picker with searchable list + logos/emblems.
- Allow quick model entry with optional pre-filled common details.
- After car creation, immediately guide to a welcoming dashboard with sample data or a short “how to log your first service/mod” tour.

This directly improves conversion from curious visitors → active users. Implement this before wider sharing on forums/Reddit.

## Commit style
Frequent commits, messages scoped to the feature being built (e.g. `feat(fuel): add L/100km calc between full-tank entries`)