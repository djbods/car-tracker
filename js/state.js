// Shared mutable state + small cross-cutting helpers.
// Every module that needs to read/write app state imports the `state`
// object and mutates its properties directly — that's how we share live
// bindings across files without bundler magic.

import { DEFAULT_GARAGE_NAME } from '../data.js';

// ──────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────

export const ACTIVE_VEHICLE_KEY = 'activeVehicleId';
export const SCOPE_LABELS = { year: 'This year', '30d': 'Last 30 days', all: 'All time' };
export const PER_FILE_LIMIT_BYTES = 10 * 1024 * 1024;
export const DB_NAME = 'e39garage';
export const DB_VER  = 1;

export const typeIcons  = { mod:'⚙️', service:'🛠️', repair:'🔧', fuel:'⛽' };
export const typeLabels = { mod:'Mod', service:'Service', repair:'Repair', fuel:'Fuel' };

// ──────────────────────────────────────────────────────────────────
// Mutable state — mutate properties on this object, do not reassign it
// ──────────────────────────────────────────────────────────────────

export const state = {
  // Legacy IndexedDB handle — only opened to migrate old local photos to
  // Supabase Storage on first sign-in; safe to ignore otherwise.
  db: null,

  // Per-vehicle records loaded from Supabase. Refreshed when switching
  // vehicles. Empty defaults so renders before loadAll() don't blow up.
  entries:  [],
  fuelLogs: [],
  documents: [],

  // Total bytes the user has uploaded across all vehicles — backs the
  // 50MB soft cap on the Glovebox tab.
  userStorageBytes: 0,

  // Every vehicle in the user's garage.
  vehicles: [],

  // The currently-active vehicle, denormalised into the UI's `car` shape
  // (see rowToCar in data.js). Blank defaults keep the Add Vehicle form
  // brand-neutral.
  car: {
    year:'', make:'', model:'', body:'', engine:'', variant:'',
    colour:'', odo:'', odoUnit:'km', nickname:''
  },
  vehicleId: null,   // active vehicle id — kept in sync with localStorage

  // Add-entry modal: which type-pill is selected (mod / service / repair).
  activeType: 'mod',

  // Detail modal — at most one of these is set at a time. Fuel and regular
  // entries share the modal; the delete handler routes by checking
  // fuelDetailId first.
  detailId: null,
  fuelDetailId: null,

  // Spend screen time scope. Defaults to 'year' so the hero number is the
  // immediately-useful "spent on this car this year" rather than lifetime.
  spendScope: 'year', // 'year' | '30d' | 'all'

  // Cache of every mod {title, category} the user has logged across all
  // their vehicles. Powers the brand-autocomplete datalist. Refreshed on
  // modal open and patched in-place after a successful save so the next
  // open sees the new title without another round-trip.
  modTitleSuggestions: [],

  garageName: DEFAULT_GARAGE_NAME,

  // True while we're fetching this vehicle's entries from Supabase.
  // renderList reads this to swap the "No entries yet." empty state for
  // a spinner so the UI doesn't lie about an empty list mid-fetch.
  isLoadingEntries: false,

  // Car modal state: null → "add a new vehicle" mode; otherwise the id of
  // the vehicle being edited (almost always the currently active one).
  editingVehicleId: null,

  // Doc preview modal — which document is currently open.
  previewDocId: null,
};

// ──────────────────────────────────────────────────────────────────
// Tier gate — every paid-feature caller must funnel through this.
// Stays false until Stripe is wired up.
// ──────────────────────────────────────────────────────────────────

export function isPaidTier() {
  return false;
}

// ──────────────────────────────────────────────────────────────────
// BMW is the only make with bespoke chassis/body/engine UI — everywhere
// else we fall back to plain text inputs. Centralised so the form, badge,
// and renderCarCard all agree on what "BMW mode" means.
// ──────────────────────────────────────────────────────────────────

export const isBMW = make => (make || '').trim().toLowerCase() === 'bmw';

// ──────────────────────────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────────────────────────

export const fmt     = c => '$' + (c || 0).toFixed(0);
export const today   = () => new Date().toISOString().split('T')[0];
export const fmtDate = d => new Date(d + 'T00:00:00')
  .toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' });

export function formatBytes(n) {
  if (!n || n < 1024) return `${n || 0} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

// Returns { status: 'overdue'|'soon'|'ok'|null, label }. Null when no
// expiry is set — the UI hides the pill in that case.
export function expiryStatus(isoDate) {
  if (!isoDate) return { status: null, label: '' };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(isoDate); expiry.setHours(0, 0, 0, 0);
  const days = Math.round((expiry - today) / 86400000);
  const formatted = expiry.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  if (days < 0)   return { status: 'overdue', label: `Expired ${formatted}` };
  if (days <= 14) return { status: 'soon',    label: `Expires in ${days}d` };
  if (days <= 60) return { status: 'soon',    label: `Expires ${formatted}` };
  return { status: 'ok', label: `Expires ${formatted}` };
}

export function docIcon(type) {
  switch (type) {
    case 'Insurance':    return '🛡️';
    case 'Registration': return '🪪';
    case 'Roadworthy':   return '✅';
    case 'Warranty':     return '📜';
    case 'Manual':       return '📖';
    case 'Receipt':      return '🧾';
    default:             return '📄';
  }
}

// ──────────────────────────────────────────────────────────────────
// Spend-screen scope helpers
// ──────────────────────────────────────────────────────────────────

// Return the inclusive date cutoff for the active spend scope, or null
// when the scope is 'all'. Shared so entriesInScope/fuelInScope always
// agree on what "in scope" means.
export function scopeCutoff() {
  if (state.spendScope === 'all') return null;
  const now = new Date();
  if (state.spendScope === 'year') return new Date(now.getFullYear(), 0, 1);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export function entriesInScope() {
  const cutoff = scopeCutoff();
  if (!cutoff) return state.entries;
  return state.entries.filter(e => new Date(e.date) >= cutoff);
}

export function fuelInScope() {
  const cutoff = scopeCutoff();
  if (!cutoff) return state.fuelLogs;
  return state.fuelLogs.filter(f => new Date(f.date) >= cutoff);
}

// ──────────────────────────────────────────────────────────────────
// Cross-module UI helpers (imported almost everywhere)
// ──────────────────────────────────────────────────────────────────

// Tiny modal-close helper — every modal uses the same .open class.
export const close = m => m.classList.remove('open');

// Toast: 2.2s fade. The element lives in index.html.
export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
