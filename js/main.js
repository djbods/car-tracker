// App entry point. Imports every module for side-effects (DOM refs
// captured at load), wires top-level handlers, runs the auth/boot loop.
//
// Module scripts are deferred by spec, so document.getElementById calls
// inside any imported module run after the DOM is parsed — no
// DOMContentLoaded wrapper needed.

import { supabase } from '../supabase-client.js';
import {
  upsertVehicle, addEntry, addFuelLog,
  uploadVehiclePhoto, getVehiclePhotoUrl,
  getGarageName, setGarageName,
  loadEntries, loadFuelLogs,
  clearAllEntries,
  rowToCar,
  DEFAULT_GARAGE_NAME,
} from '../data.js';

import {
  state,
  showToast, close, today,
  isPaidTier,
} from './state.js';
import { openDB } from './legacy-db.js';
import { loadSavedPhoto, applyPhoto, wirePhotoHandlers } from './photo.js';
import {
  loadAll, applyGarageName,
  openCarModal, wireVehicleHandlers,
} from './vehicle.js';
import { wireEntryHandlers } from './entries.js';
import { wireDocumentHandlers } from './documents.js';
import { renderAll, syncNavClearance } from './render.js';
import { exportToExcel } from './excel-export.js';

// ══════════════════════════════════════════════════════
// Modals — close buttons + backdrop click
// ══════════════════════════════════════════════════════

const addModal        = document.getElementById('add-modal');
const detailModal     = document.getElementById('detail-modal');
const carModal        = document.getElementById('car-modal');
const garageModal     = document.getElementById('garage-modal');
const installModal    = document.getElementById('install-modal');
const garageNameModal = document.getElementById('garage-name-modal');
const fuelModal       = document.getElementById('fuel-modal');
const docModal        = document.getElementById('document-modal');
const docPreviewModal = document.getElementById('doc-preview-modal');
const exportModal     = document.getElementById('export-modal');

document.getElementById('cancel-btn').onclick               = () => close(addModal);
document.getElementById('cancel-car-btn').onclick           = () => close(carModal);
document.getElementById('detail-close-btn').onclick         = () => close(detailModal);
document.getElementById('close-garage-btn').onclick         = () => close(garageModal);
document.getElementById('close-install-modal').onclick      = () => close(installModal);
document.getElementById('cancel-garage-name-btn').onclick   = () => close(garageNameModal);
document.getElementById('cancel-fuel-btn').onclick          = () => close(fuelModal);
document.getElementById('cancel-doc-btn').onclick           = () => close(docModal);
document.getElementById('doc-preview-close-btn').onclick    = () => close(docPreviewModal);
document.getElementById('cancel-export-btn').onclick        = () => close(exportModal);

[addModal, detailModal, carModal, garageModal, installModal, garageNameModal, fuelModal, docModal, docPreviewModal, exportModal].forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) close(m); })
);

// Garage Name editor — opened from Settings, persisted to Supabase
// Auth's user_metadata so it follows the user across devices without a
// schema bump.
document.getElementById('btn-edit-garage-name').onclick = () => {
  document.getElementById('garage-name-input').value =
    state.garageName === DEFAULT_GARAGE_NAME ? '' : state.garageName;
  garageNameModal.classList.add('open');
};
document.getElementById('save-garage-name-btn').onclick = async () => {
  try {
    const saved = await setGarageName(document.getElementById('garage-name-input').value);
    applyGarageName(saved);
    close(garageNameModal);
    showToast('Garage name saved ✓');
  } catch (err) {
    showToast('Save failed: ' + (err?.message || 'unknown error'));
  }
};

// ══════════════════════════════════════════════════════
// Bottom nav — screen switcher
// ══════════════════════════════════════════════════════

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('screen-' + btn.dataset.screen).classList.add('active');
    renderAll();
  });
});

// ══════════════════════════════════════════════════════
// Settings — Export, Import, Install help, Clear data
// ══════════════════════════════════════════════════════

// Export — opens format selection modal
document.getElementById('btn-export').onclick = () => {
  exportModal.classList.add('open');
};

// Export modal: handle format selection and trigger export
document.getElementById('do-export-btn').onclick = async () => {
  const format = document.getElementById('export-format-select').value;
  close(exportModal);

  if (format === 'excel') {
    if (!isPaidTier()) {
      showToast('Excel export is a paid feature — coming soon');
      return;
    }
    try {
      await exportToExcel();
      showToast('Excel exported ✓');
    } catch (err) {
      showToast('Export failed: ' + (err?.message || 'unknown error'));
    }
  } else if (format === 'pdf') {
    showToast('PDF export coming soon');
  } else {
    try {
      const [allEntries, allFuel] = state.vehicleId
        ? await Promise.all([loadEntries(state.vehicleId), loadFuelLogs(state.vehicleId)])
        : [[], []];
      // Backups embed the photo as a data URL so they're self-contained.
      let photo = null;
      if (state.car.photoPath) {
        try {
          const url  = await getVehiclePhotoUrl(state.car.photoPath);
          const blob = await (await fetch(url)).blob();
          photo = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload  = () => res(r.result);
            r.onerror = () => rej(r.error);
            r.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Photo export failed:', err);
        }
      }
      const payload = {
        version: 2,
        exported: new Date().toISOString(),
        car: state.car,
        entries: allEntries,
        fuelLogs: allFuel,
        photo: photo || null
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `e39-garage-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exported ✓');
    } catch (err) {
      showToast('Export failed: ' + (err?.message || 'unknown error'));
    }
  }
};

// Import
document.getElementById('btn-import').onclick = () => {
  document.getElementById('import-input').click();
};
document.getElementById('import-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.entries || !Array.isArray(data.entries)) throw new Error('Invalid backup file');
      if (!state.vehicleId) throw new Error('Vehicle not loaded yet — try again in a moment');
      if (!confirm(`Import ${data.entries.length} entries? This will add to your existing data.`)) return;

      // Restore car details first so the vehicle row reflects the backup.
      if (data.car) {
        const saved = await upsertVehicle({ ...data.car, id: state.vehicleId });
        state.car = rowToCar(saved);
        state.vehicleId = saved.id;
      }

      // Push every entry — Supabase mints new uuids, so we don't try
      // to dedupe by id (legacy backups use Date.now() numeric ids
      // anyway).
      let added = 0;
      for (const entry of data.entries) {
        try {
          const saved = await addEntry(state.vehicleId, entry);
          state.entries.unshift(saved);
          added++;
        } catch (err) {
          console.error('Skipped entry during import:', entry, err);
        }
      }
      state.entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

      // v2+ backups carry fuel logs separately. Older backups omit the
      // field entirely, so guard against it before iterating.
      if (Array.isArray(data.fuelLogs)) {
        for (const fuel of data.fuelLogs) {
          try {
            const saved = await addFuelLog(state.vehicleId, fuel);
            state.fuelLogs.unshift(saved);
            added++;
          } catch (err) {
            console.error('Skipped fuel log during import:', fuel, err);
          }
        }
        state.fuelLogs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      }

      // Import the embedded photo straight into Supabase Storage so it
      // follows the account; only do this if the user doesn't already
      // have a photo set, to avoid clobbering a current one.
      if (data.photo && state.vehicleId && !state.car.photoPath) {
        try {
          const blob = await (await fetch(data.photo)).blob();
          const path = await uploadVehiclePhoto(state.vehicleId, blob);
          state.car.photoPath = path;
          applyPhoto(data.photo);
        } catch (err) {
          console.error('Photo import failed:', err);
        }
      }

      renderAll();
      showToast(`Imported ${added} entries ✓`);
    } catch (err) {
      alert('Could not read backup: ' + err.message);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// Install help
document.getElementById('btn-install-help').onclick = () => installModal.classList.add('open');

// Clear data
document.getElementById('btn-clear-data').onclick = async () => {
  if (!confirm('Delete ALL entries? This cannot be undone.\n\nExport a backup first if you want to keep your data.')) return;
  try {
    await clearAllEntries(state.vehicleId);
    state.entries = [];
    state.fuelLogs = [];
    renderAll();
    showToast('All entries deleted');
  } catch (err) {
    showToast('Delete failed: ' + (err?.message || 'unknown error'));
  }
};

// ══════════════════════════════════════════════════════
// Install banner (one-tap dismiss, remembered locally)
// ══════════════════════════════════════════════════════

const banner = document.getElementById('install-banner');
if (localStorage.getItem('e39_banner_dismissed') || window.navigator.standalone) {
  banner.classList.add('hidden');
}
document.getElementById('dismiss-banner').onclick = () => {
  banner.classList.add('hidden');
  localStorage.setItem('e39_banner_dismissed', '1');
};

// ══════════════════════════════════════════════════════
// Feature-module wiring (handlers that need cross-module callbacks)
// ══════════════════════════════════════════════════════

wirePhotoHandlers({ openCarModal });
wireVehicleHandlers();
wireEntryHandlers();
wireDocumentHandlers();

// ══════════════════════════════════════════════════════
// Nav-clearance reflows (fixed bottom nav can hide list items)
// ══════════════════════════════════════════════════════

syncNavClearance();
window.addEventListener('load', syncNavClearance);
window.addEventListener('resize', syncNavClearance);
window.addEventListener('orientationchange', syncNavClearance);
if (typeof ResizeObserver !== 'undefined') {
  const nav = document.querySelector('.nav');
  if (nav) new ResizeObserver(syncNavClearance).observe(nav);
}

// ══════════════════════════════════════════════════════
// Service Worker (offline support — optional, safe to fail)
// ══════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {/* sw optional */});
}

// ══════════════════════════════════════════════════════
// Auth gate
// ══════════════════════════════════════════════════════

const authOverlay = document.getElementById('auth-overlay');
const authForm    = document.getElementById('auth-form');
const authEmail   = document.getElementById('auth-email');
const authPass    = document.getElementById('auth-password');
const authSubmit  = document.getElementById('auth-submit');
const authError   = document.getElementById('auth-error');
const authInfo    = document.getElementById('auth-info');
const authTabLogin  = document.getElementById('auth-tab-login');
const authTabSignup = document.getElementById('auth-tab-signup');
const userBar       = document.getElementById('user-bar');
const userBarEmail  = document.getElementById('user-bar-email');
const userBarLogout = document.getElementById('user-bar-logout');

let authMode  = 'login';
let appBooted = false;

function setAuthMode(mode) {
  authMode = mode;
  authTabLogin.classList.toggle('active',  mode === 'login');
  authTabSignup.classList.toggle('active', mode === 'signup');
  authSubmit.textContent = mode === 'login' ? 'Log in' : 'Create account';
  authPass.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  clearAuthMessages();
}
function clearAuthMessages() {
  authError.classList.remove('show'); authError.textContent = '';
  authInfo.classList.remove('show');  authInfo.textContent  = '';
}
function showAuthError(msg) {
  authInfo.classList.remove('show');
  authError.textContent = msg;
  authError.classList.add('show');
}
function showAuthInfo(msg) {
  authError.classList.remove('show');
  authInfo.textContent = msg;
  authInfo.classList.add('show');
}

authTabLogin.addEventListener('click',  () => setAuthMode('login'));
authTabSignup.addEventListener('click', () => setAuthMode('signup'));

authForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPass.value;
  if (!email || password.length < 6) {
    showAuthError('Enter an email and a password of at least 6 characters.');
    return;
  }
  clearAuthMessages();
  authSubmit.disabled = true;
  const originalLabel = authSubmit.textContent;
  authSubmit.textContent = authMode === 'login' ? 'Logging in…' : 'Creating account…';
  try {
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // If "Confirm email" is enabled in Supabase, there's no session yet.
      if (!data.session) {
        showAuthInfo('Check your email to confirm your account, then log in.');
        setAuthMode('login');
      }
    }
  } catch (err) {
    showAuthError(err?.message || 'Something went wrong. Try again.');
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = originalLabel;
  }
});

userBarLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// ══════════════════════════════════════════════════════
// Boot overlay (spinner + error retry)
// ══════════════════════════════════════════════════════

const bootOverlay  = document.getElementById('boot-overlay');
const bootErrorMsg = document.getElementById('boot-error-msg');
const bootRetry    = document.getElementById('boot-retry');

function showBootLoading() {
  bootOverlay.classList.remove('error');
  bootOverlay.classList.add('open');
}
function showBootError(msg) {
  bootErrorMsg.textContent = msg;
  bootOverlay.classList.add('error', 'open');
}
function hideBoot() { bootOverlay.classList.remove('open', 'error'); }

// Minimum time the startup splash stays up so the fuel-fill animation reads
// as intentional, not a flicker — getSession() often resolves from cache in
// well under 100ms. splashStart is captured at module eval (≈ first paint).
const SPLASH_MIN_MS = 1500;
const splashStart = performance.now();
function splashHold() {
  const remaining = SPLASH_MIN_MS - (performance.now() - splashStart);
  return remaining > 0 ? new Promise(r => setTimeout(r, remaining)) : Promise.resolve();
}

bootRetry.addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    appBooted = false;
    await bootApp(session);
  } else {
    hideBoot();
    showAuthGate();
  }
});

async function bootApp(session) {
  userBarEmail.textContent = session.user.email || '';
  userBar.classList.add('signed-in');
  authOverlay.classList.remove('open');
  if (appBooted) return;
  showBootLoading();
  try {
    await openDB();
    applyGarageName(await getGarageName());
    await loadAll();
    await loadSavedPhoto();
    renderAll();
    document.getElementById('input-date').value = today();
    appBooted = true;
    hideBoot();
    // First-time users: bounce them straight to Add Vehicle so the
    // empty garage isn't just a dead end.
    if (!state.vehicleId) openCarModal('add');
  } catch (err) {
    console.error('Boot failed:', err);
    showBootError(err?.message || 'Could not load your garage. Check your connection and try again.');
  }
}

function showAuthGate() {
  userBar.classList.remove('signed-in');
  userBarEmail.textContent = '';
  authPass.value = '';
  setAuthMode('login');
  authOverlay.classList.add('open');
  hideBoot(); // dismiss the startup splash so the auth gate fades in cleanly
}

// ══════════════════════════════════════════════════════
// Kick off the app
// ══════════════════════════════════════════════════════

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  await splashHold();
  if (session) {
    await bootApp(session);
  } else {
    showAuthGate();
  }
  supabase.auth.onAuthStateChange((event, newSession) => {
    if (newSession) {
      bootApp(newSession);
    } else {
      showAuthGate();
    }
  });
})();
