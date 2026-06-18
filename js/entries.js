// Add/delete entry, log/delete fuel, brand-autocomplete datalist, and
// the Spend-screen scope toggle. Anything that touches state.entries or
// state.fuelLogs (other than rendering) lives here.

import {
  state,
  showToast, close, today,
  distanceUnit,
} from './state.js';
import {
  addEntry, deleteEntry, updateEntry,
  loadModTitleSuggestions,
  addFuelLog, deleteFuelLog, updateFuelLog,
  updateVehicleOdometer,
} from '../data.js';
import { renderAll, renderSpendScreen } from './render.js';
import { openWizard } from './onboarding.js';
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
// Modal openers — shared by the FAB chooser, the garage-card CTA, and the
// detail modal's Edit button. Passing a record puts the modal in edit mode.
// ══════════════════════════════════════════════════════

async function openEntryModal(entry = null) {
  const isEdit = !!entry;
  state.editingEntryId = isEdit ? entry.id : null;
  const type = isEdit ? entry.type : 'mod';
  state.activeType = type;

  document.getElementById('add-modal-title').textContent = isEdit ? 'Edit Entry' : 'Log Entry';
  document.getElementById('save-entry-btn').textContent  = isEdit ? 'Save changes' : 'Save Entry';

  document.getElementById('input-title').value    = isEdit ? entry.title : '';
  document.getElementById('input-cost').value     = isEdit && entry.cost ? entry.cost : '';
  document.getElementById('input-notes').value    = isEdit ? (entry.notes || '') : '';
  document.getElementById('input-date').value     = isEdit ? entry.date : today();
  document.getElementById('input-category').value = isEdit ? (entry.category || '') : '';

  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active','mod','service','repair'));
  document.querySelector(`[data-type="${type}"]`).classList.add('active', type);
  document.getElementById('mod-category-group').style.display = type === 'mod' ? '' : 'none';
  syncTitleListAttribute();

  // Show the modal immediately — suggestions can fill in once the fetch
  // returns. Empty datalist behaves like a normal text input meanwhile.
  renderBrandDatalist(document.getElementById('input-category').value || null);
  addModal.classList.add('open');
  setTimeout(() => document.getElementById('input-title').focus(), 350);
  try {
    state.modTitleSuggestions = await loadModTitleSuggestions();
    renderBrandDatalist(document.getElementById('input-category').value || null);
  } catch (err) {
    console.warn('Brand suggestions unavailable:', err?.message || err);
  }
}

function openFuelModal(fuel = null) {
  const isEdit = !!fuel;
  state.editingFuelId = isEdit ? fuel.id : null;
  document.getElementById('fuel-modal-title').textContent = isEdit ? 'Edit Fill-up' : 'Log Fill-up';
  document.getElementById('save-fuel-btn').textContent    = isEdit ? 'Save changes' : 'Save Fill-up';
  document.getElementById('fuel-odo-label').textContent   = `Odometer (${distanceUnit()})`;

  // Pre-fill odometer with the car's last known reading on a new fill — most
  // fills happen within ~700km of the previous one.
  document.getElementById('fuel-input-odo').value       = isEdit ? fuel.odometer : (state.car.odo || '');
  document.getElementById('fuel-input-date').value      = isEdit ? fuel.date : today();
  document.getElementById('fuel-input-litres').value    = isEdit ? fuel.litres : '';
  document.getElementById('fuel-input-cost').value      = isEdit && fuel.totalCost ? fuel.totalCost : '';
  document.getElementById('fuel-input-station').value   = isEdit ? (fuel.station || '') : '';
  document.getElementById('fuel-input-notes').value     = isEdit ? (fuel.notes || '') : '';
  document.getElementById('fuel-input-fulltank').checked = isEdit ? fuel.isFullTank !== false : true;
  fuelModal.classList.add('open');
  setTimeout(() => document.getElementById('fuel-input-odo').focus(), 350);
}

// ══════════════════════════════════════════════════════
// Top-level wiring — called once by main.js
// ══════════════════════════════════════════════════════

export function wireEntryHandlers() {
  const fabActionModal = document.getElementById('fab-action-modal');
  // ── FAB: opens the "what do you want to add?" chooser ───────────────
  document.getElementById('fab-btn').onclick = () => {
    // Entries are scoped to a vehicle — bounce the user to Add Vehicle
    // if they haven't created one yet rather than opening a modal that
    // can't save.
    if (!state.vehicleId) { openWizard(); return; }
    // Sold / archived cars are read-only. Belt-and-braces: the FAB is
    // also visually disabled via body.car-sold, but a click could still
    // slip through on some browsers if the pointer-events rule is
    // overridden.
    if (state.car.status === 'sold' || state.car.status === 'archived') {
      showToast('This vehicle is read-only — change status to Active to add entries');
      return;
    }
    // On the Docs tab the only sensible "add" is a document, so skip the
    // chooser and go straight there. Everywhere else, offer the full menu
    // (entry / fuel / document) so fuel logging is discoverable from the
    // FAB, not just the garage-card CTA.
    const activeScreen = document.querySelector('.nav-item.active')?.dataset.screen;
    if (activeScreen === 'documents') { openDocumentModal(); return; }
    fabActionModal.classList.add('open');
  };

  // ── FAB chooser actions ─────────────────────────────────────────────
  document.getElementById('fab-action-entry').onclick    = () => { close(fabActionModal); openEntryModal(); };
  document.getElementById('fab-action-fuel').onclick     = () => { close(fabActionModal); openFuelModal(); };
  document.getElementById('fab-action-document').onclick = () => { close(fabActionModal); openDocumentModal(); };
  document.getElementById('cancel-fab-action-btn').onclick = () => close(fabActionModal);

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

  // ── Save entry (add or edit) ───────────────────────────────────────
  document.getElementById('save-entry-btn').onclick = async () => {
    const title = document.getElementById('input-title').value.trim();
    if (!title) { document.getElementById('input-title').focus(); return; }
    if (!state.vehicleId) { showToast('No vehicle loaded'); return; }

    const fields = {
      type:  state.activeType,
      title,
      cost:  parseFloat(document.getElementById('input-cost').value)  || 0,
      date:  document.getElementById('input-date').value || today(),
      notes: document.getElementById('input-notes').value.trim(),
      category: state.activeType === 'mod'
        ? (document.getElementById('input-category').value || null)
        : null,
    };

    // ── Edit: optimistic in-place replace, reconcile with the saved row. ──
    if (state.editingEntryId) {
      const editingId = state.editingEntryId;
      const idx = state.entries.findIndex(e => e.id === editingId);
      state.editingEntryId = null;
      if (idx === -1) { showToast('Entry no longer exists'); close(addModal); return; }
      const prev = state.entries[idx];
      state.entries[idx] = { ...prev, ...fields };
      close(addModal);
      renderAll();
      try {
        const saved = await updateEntry(state.vehicleId, prev, fields);
        const i = state.entries.findIndex(e => e.id === prev.id);
        if (i !== -1) state.entries[i] = saved;
        // Date may have changed — keep the list newest-first.
        state.entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        if (saved.type === 'mod' && saved.title) {
          state.modTitleSuggestions.push({ title: saved.title, category: saved.category || null });
        }
        renderAll();
        showToast('Entry updated ✓');
      } catch (err) {
        state.entries[idx] = prev;
        renderAll();
        showToast('Update failed: ' + (err?.message || 'unknown error'));
      }
      return;
    }

    // ── Add: optimistic insert, reconcile on success/failure. ──
    const draft = { id: 'tmp-' + Date.now(), ...fields };
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

  // ── Edit button on the shared detail modal (routes entry vs fuel) ────
  document.getElementById('detail-edit-btn').onclick = () => {
    if (state.fuelDetailId) {
      const fuel = state.fuelLogs.find(f => f.id === state.fuelDetailId);
      if (!fuel) return;
      close(detailModal);
      openFuelModal(fuel);
      return;
    }
    if (!state.detailId) return;
    const entry = state.entries.find(e => e.id === state.detailId);
    if (!entry) return;
    close(detailModal);
    openEntryModal(entry);
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

  // ── Fuel: open modal (garage-card CTA) ──────────────────────────────
  document.getElementById('fuel-log-btn').onclick = () => {
    if (!state.vehicleId) { openWizard(); return; }
    if (state.car.status === 'sold' || state.car.status === 'archived') {
      showToast('This vehicle is read-only — change status to Active to log fuel');
      return;
    }
    openFuelModal();
  };

  // ── Fuel: save (add or edit) ───────────────────────────────────────
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
    const fields = {
      date:       document.getElementById('fuel-input-date').value || today(),
      odometer:   odo,
      litres,
      totalCost:  Number.isFinite(costRaw) ? costRaw : 0,
      station:    document.getElementById('fuel-input-station').value.trim(),
      isFullTank: document.getElementById('fuel-input-fulltank').checked,
      notes:      document.getElementById('fuel-input-notes').value.trim(),
    };

    // ── Edit: optimistic in-place replace. We don't re-touch the car's
    // odometer here — that bump only makes sense for a brand-new fill. ──
    if (state.editingFuelId) {
      const editingId = state.editingFuelId;
      const idx = state.fuelLogs.findIndex(f => f.id === editingId);
      state.editingFuelId = null;
      if (idx === -1) { showToast('Fill-up no longer exists'); close(fuelModal); return; }
      const prev = state.fuelLogs[idx];
      state.fuelLogs[idx] = { ...prev, ...fields };
      close(fuelModal);
      renderAll();
      try {
        const saved = await updateFuelLog(editingId, fields);
        const i = state.fuelLogs.findIndex(f => f.id === editingId);
        if (i !== -1) state.fuelLogs[i] = saved;
        state.fuelLogs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        renderAll();
        showToast('Fill-up updated ✓');
      } catch (err) {
        state.fuelLogs[idx] = prev;
        renderAll();
        showToast('Update failed: ' + (err?.message || 'unknown error'));
      }
      return;
    }

    // ── Add: optimistic insert at the front (loadFuelLogs returns
    // date-desc), close the modal, render, then reconcile. ──
    const draft = { id: 'tmp-' + Date.now(), ...fields };
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
      // don't regress. Persist it so the bumped reading survives a reload
      // (previously this only lived in memory and reverted on refresh).
      const currentOdo = parseInt(state.car.odo, 10);
      if (!Number.isFinite(currentOdo) || saved.odometer > currentOdo) {
        state.car.odo = String(saved.odometer);
        const vrow = state.vehicles.find(v => v.id === state.vehicleId);
        if (vrow) vrow.odometer = saved.odometer;
        updateVehicleOdometer(state.vehicleId, saved.odometer)
          .catch(err => console.warn('Odometer sync failed:', err?.message || err));
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
