// Add/delete entry, log/delete fuel, brand-autocomplete datalist, and
// the Spend-screen scope toggle. Anything that touches state.entries or
// state.fuelLogs (other than rendering) lives here.

import {
  state,
  showToast, close, today,
} from './state.js';
import {
  addEntry, deleteEntry,
  loadModTitleSuggestions,
  addFuelLog, deleteFuelLog,
} from '../data.js';
import { renderAll, renderSpendScreen } from './render.js';
import { openCarModal } from './vehicle.js';
import { openDocumentModal } from './documents.js';

const addModal    = document.getElementById('add-modal');
const detailModal = document.getElementById('detail-modal');
const fuelModal   = document.getElementById('fuel-modal');

// ══════════════════════════════════════════════════════
// Brand-autocomplete datalist
// ══════════════════════════════════════════════════════

// Rebuild the brand-autocomplete <datalist> from the cached suggestions,
// optionally narrowed to a single category. Uses createElement rather
// than innerHTML so user-entered titles don't need manual HTML escaping.
function renderBrandDatalist(category) {
  const datalist = document.getElementById('brand-suggestions');
  const pool = category
    ? state.modTitleSuggestions.filter(s => s.category === category)
    : state.modTitleSuggestions;
  const seen = new Set();
  const distinct = [];
  for (const { title } of pool) {
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(title);
  }
  distinct.sort((a, b) => a.localeCompare(b));
  datalist.replaceChildren(...distinct.map(t => {
    const opt = document.createElement('option');
    opt.value = t;
    return opt;
  }));
}

// Sync the title input's `list` attribute with the active type — we only
// want brand suggestions surfacing on mod entries, not service/repair.
function syncTitleListAttribute() {
  const input = document.getElementById('input-title');
  if (state.activeType === 'mod') input.setAttribute('list', 'brand-suggestions');
  else input.removeAttribute('list');
}

// ══════════════════════════════════════════════════════
// Top-level wiring — called once by main.js
// ══════════════════════════════════════════════════════

export function wireEntryHandlers() {
  // ── FAB: context-aware "Add" button ────────────────────────────────
  document.getElementById('fab-btn').onclick = async () => {
    // Entries are scoped to a vehicle — bounce the user to Add Vehicle
    // if they haven't created one yet rather than opening a modal that
    // can't save.
    if (!state.vehicleId) { openCarModal('add'); return; }
    // Sold / archived cars are read-only. Belt-and-braces: the FAB is
    // also visually disabled via body.car-sold, but a click could still
    // slip through on some browsers if the pointer-events rule is
    // overridden.
    if (state.car.status === 'sold' || state.car.status === 'archived') {
      showToast('This vehicle is read-only — change status to Active to add entries');
      return;
    }
    // Context-aware: the FAB opens whatever "Add" makes sense on the
    // current screen. Docs tab → upload a document; everywhere else →
    // log an entry.
    const activeScreen = document.querySelector('.nav-item.active')?.dataset.screen;
    if (activeScreen === 'documents') { openDocumentModal(); return; }
    document.getElementById('input-title').value = '';
    document.getElementById('input-cost').value  = '';
    document.getElementById('input-notes').value = '';
    document.getElementById('input-date').value  = today();
    document.getElementById('input-category').value = '';
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active','mod','service','repair'));
    document.querySelector('[data-type="mod"]').classList.add('active','mod');
    state.activeType = 'mod';
    document.getElementById('mod-category-group').style.display = '';
    syncTitleListAttribute();
    // Show the modal immediately — suggestions can fill in once the
    // fetch returns. Empty datalist behaves like a normal text input in
    // the meantime.
    renderBrandDatalist(null);
    addModal.classList.add('open');
    setTimeout(() => document.getElementById('input-title').focus(), 350);
    try {
      state.modTitleSuggestions = await loadModTitleSuggestions();
      renderBrandDatalist(null);
    } catch (err) {
      // Non-fatal — suggestions are a nice-to-have, fall back to
      // free-text only.
      console.warn('Brand suggestions unavailable:', err?.message || err);
    }
  };

  // ── Type pills (mod / service / repair) ────────────────────────────
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active','mod','service','repair'));
      btn.classList.add('active', btn.dataset.type);
      state.activeType = btn.dataset.type;
      document.getElementById('mod-category-group').style.display = state.activeType === 'mod' ? '' : 'none';
      syncTitleListAttribute();
    };
  });

  // Re-narrow the datalist when the user picks (or clears) a category.
  // Empty value means "show everything"; otherwise show titles
  // previously logged under that category.
  document.getElementById('input-category').addEventListener('change', e => {
    renderBrandDatalist(e.target.value || null);
  });

  // Spend-screen time-scope toggle. Click a segment → update state,
  // sync the active class + aria-selected, re-render the whole screen.
  document.getElementById('scope-toggle').addEventListener('click', e => {
    const btn = e.target.closest('.scope-btn');
    if (!btn || !btn.dataset.scope) return;
    if (btn.dataset.scope === state.spendScope) return;
    state.spendScope = btn.dataset.scope;
    document.querySelectorAll('.scope-btn').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    renderSpendScreen();
  });

  // ── Save entry ─────────────────────────────────────────────────────
  document.getElementById('save-entry-btn').onclick = async () => {
    const title = document.getElementById('input-title').value.trim();
    if (!title) { document.getElementById('input-title').focus(); return; }
    if (!state.vehicleId) { showToast('No vehicle loaded'); return; }

    const draft = {
      id:    'tmp-' + Date.now(),     // replaced once Supabase returns the real uuid
      type:  state.activeType,
      title,
      cost:  parseFloat(document.getElementById('input-cost').value)  || 0,
      date:  document.getElementById('input-date').value || today(),
      notes: document.getElementById('input-notes').value.trim(),
      category: state.activeType === 'mod'
        ? (document.getElementById('input-category').value || null)
        : null,
    };

    // Optimistic: render immediately, reconcile on success/failure.
    state.entries.unshift(draft);
    close(addModal);
    renderAll();

    try {
      const saved = await addEntry(state.vehicleId, draft);
      const i = state.entries.findIndex(e => e.id === draft.id);
      if (i !== -1) state.entries[i] = saved;
      // Patch the autocomplete cache in-place so the next modal open
      // suggests this brand without re-hitting Supabase.
      if (saved.type === 'mod' && saved.title) {
        state.modTitleSuggestions.push({ title: saved.title, category: saved.category || null });
      }
      renderAll();
      showToast('Entry saved ✓');
    } catch (err) {
      state.entries = state.entries.filter(e => e.id !== draft.id);
      renderAll();
      showToast('Save failed: ' + (err?.message || 'unknown error'));
    }
  };

  // ── Delete (entry OR fuel — shared detail modal) ────────────────────
  document.getElementById('detail-delete-btn').onclick = async () => {
    // Fuel and regular entries share the detail modal — fuelDetailId
    // is set only when openFuelDetail() opened the modal, so it's the
    // source of truth.
    if (state.fuelDetailId) {
      if (!confirm('Delete this fill-up?')) return;
      const target = state.fuelLogs.find(f => f.id === state.fuelDetailId);
      if (!target) return;
      const removed = state.fuelLogs;
      state.fuelLogs = state.fuelLogs.filter(f => f.id !== state.fuelDetailId);
      close(detailModal);
      state.fuelDetailId = null;
      renderAll();
      try {
        await deleteFuelLog(target.id);
        showToast('Fill-up deleted');
      } catch (err) {
        state.fuelLogs = removed;
        renderAll();
        showToast('Delete failed: ' + (err?.message || 'unknown error'));
      }
      return;
    }

    if (!state.detailId || !confirm('Delete this entry?')) return;
    const target = state.entries.find(e => e.id === state.detailId);
    if (!target) return;

    const removed = state.entries;
    state.entries = state.entries.filter(e => e.id !== state.detailId);
    close(detailModal);
    renderAll();

    try {
      await deleteEntry(target);
      showToast('Entry deleted');
    } catch (err) {
      state.entries = removed;
      renderAll();
      showToast('Delete failed: ' + (err?.message || 'unknown error'));
    }
  };

  // ── Fuel: open modal ───────────────────────────────────────────────
  document.getElementById('fuel-log-btn').onclick = () => {
    if (!state.vehicleId) { openCarModal('add'); return; }
    if (state.car.status === 'sold' || state.car.status === 'archived') {
      showToast('This vehicle is read-only — change status to Active to log fuel');
      return;
    }
    // Pre-fill odometer with the car's last known reading — most fills
    // happen within ~700km of the previous one, so even the rough
    // number is closer than a blank field.
    document.getElementById('fuel-input-odo').value     = state.car.odo || '';
    document.getElementById('fuel-input-date').value    = today();
    document.getElementById('fuel-input-litres').value  = '';
    document.getElementById('fuel-input-cost').value    = '';
    document.getElementById('fuel-input-station').value = '';
    document.getElementById('fuel-input-notes').value   = '';
    document.getElementById('fuel-input-fulltank').checked = true;
    fuelModal.classList.add('open');
    setTimeout(() => document.getElementById('fuel-input-odo').focus(), 350);
  };

  // ── Fuel: save ─────────────────────────────────────────────────────
  document.getElementById('save-fuel-btn').onclick = async () => {
    const odo    = parseInt(document.getElementById('fuel-input-odo').value, 10);
    const litres = parseFloat(document.getElementById('fuel-input-litres').value);
    if (!Number.isFinite(odo) || odo <= 0) {
      document.getElementById('fuel-input-odo').focus();
      showToast('Enter the current odometer reading');
      return;
    }
    if (!Number.isFinite(litres) || litres <= 0) {
      document.getElementById('fuel-input-litres').focus();
      showToast('Enter how many litres you put in');
      return;
    }
    if (!state.vehicleId) { showToast('No vehicle loaded'); return; }

    const costRaw = parseFloat(document.getElementById('fuel-input-cost').value);
    const draft = {
      id:         'tmp-' + Date.now(),
      date:       document.getElementById('fuel-input-date').value || today(),
      odometer:   odo,
      litres,
      totalCost:  Number.isFinite(costRaw) ? costRaw : 0,
      station:    document.getElementById('fuel-input-station').value.trim(),
      isFullTank: document.getElementById('fuel-input-fulltank').checked,
      notes:      document.getElementById('fuel-input-notes').value.trim(),
    };

    // Optimistic: insert at the front (loadFuelLogs returns date-desc),
    // close the modal, render, then reconcile with the saved row.
    state.fuelLogs.unshift(draft);
    close(fuelModal);
    renderAll();

    try {
      const saved = await addFuelLog(state.vehicleId, draft);
      const i = state.fuelLogs.findIndex(f => f.id === draft.id);
      if (i !== -1) state.fuelLogs[i] = saved;
      // Keep the new fill's odometer in the car row so the next prefill
      // is accurate. Only bump forward — a fill-up with a lower odo
      // than the current reading is almost certainly a user typo;
      // don't regress.
      const currentOdo = parseInt(state.car.odo, 10);
      if (!Number.isFinite(currentOdo) || saved.odometer > currentOdo) {
        state.car.odo = String(saved.odometer);
      }
      renderAll();
      showToast('Fill-up saved ✓');
    } catch (err) {
      state.fuelLogs = state.fuelLogs.filter(f => f.id !== draft.id);
      renderAll();
      showToast('Save failed: ' + (err?.message || 'unknown error'));
    }
  };
}
