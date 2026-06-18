// Vehicle + garage: loadAll, switching, the Add/Edit car modal, and the
// "My Garage" picker. Everything that mutates state.vehicles or
// state.car lives here.

import {
  state, ACTIVE_VEHICLE_KEY,
  showToast, close,
} from './state.js';
import {
  loadVehicles, upsertVehicle, deleteVehicle, rowToCar,
  loadEntries, loadFuelLogs, loadDocuments,
  getUserStorageUsageBytes,
  DEFAULT_GARAGE_NAME,
} from '../data.js';
import { renderBrandLogo } from '../logos.js';
import { renderAll } from './render.js';
import { loadSavedPhoto, resetPhoto } from './photo.js';
import { openWizard } from './onboarding.js';

const carModal      = document.getElementById('car-modal');
const garageModal   = document.getElementById('garage-modal');
const garageList    = document.getElementById('garage-list');
const carModalTitle = document.querySelector('#car-modal .modal-title');
const saveCarBtn    = document.getElementById('save-car-btn');
const carMakeInput  = document.getElementById('car-make');

// ══════════════════════════════════════════════════════
// Load + switch
// ══════════════════════════════════════════════════════

// Hydrate from Supabase and pick the last-active vehicle (or oldest) so
// the user lands where they left off. First-time users land with no
// vehicle — renderAll() draws an empty state and bootApp() prompts them
// to add one.
export async function loadAll() {
  state.vehicles = await loadVehicles();
  if (!state.vehicles.length) {
    state.vehicleId = null;
    state.car = { year:'', make:'', model:'', body:'', engine:'', variant:'',
                  colour:'', odo:'', odoUnit:'km', nickname:'' };
    state.entries = [];
    state.fuelLogs = [];
    state.documents = [];
    state.userStorageBytes = 0;
    return;
  }
  const stored = localStorage.getItem(ACTIVE_VEHICLE_KEY);
  const active = state.vehicles.find(v => v.id === stored) || state.vehicles[0];
  setActiveVehicle(active);
  // Documents and storage usage are user-scoped (usage spans all
  // vehicles), but bundling them with the per-vehicle fetch keeps the
  // boot sequence to a single round trip.
  let usageResult;
  [state.entries, state.fuelLogs, state.documents, usageResult] = await Promise.all([
    loadEntries(state.vehicleId),
    loadFuelLogs(state.vehicleId),
    loadDocuments(state.vehicleId),
    getUserStorageUsageBytes().catch(() => 0),
  ]);
  state.userStorageBytes = usageResult || 0;
}

export function setActiveVehicle(row) {
  state.car = rowToCar(row);
  state.vehicleId = row.id;
  localStorage.setItem(ACTIVE_VEHICLE_KEY, row.id);
}

// Switch the active vehicle: re-pull its entries + photo, then re-render
// everything. Photo is re-resolved against the new vehicle's photo_path.
export async function switchVehicle(id) {
  if (id === state.vehicleId) return;
  const row = state.vehicles.find(v => v.id === id);
  if (!row) return;
  setActiveVehicle(row);
  // Clear stale entries + show a per-list spinner while the new
  // vehicle's entries load, so the lists don't briefly read "No entries
  // yet." for a vehicle that actually has entries.
  state.entries = [];
  state.fuelLogs = [];
  state.documents = [];
  state.isLoadingEntries = true;
  resetPhoto();
  renderAll();
  try {
    [state.entries, state.fuelLogs, state.documents] = await Promise.all([
      loadEntries(state.vehicleId),
      loadFuelLogs(state.vehicleId),
      loadDocuments(state.vehicleId),
    ]);
    await loadSavedPhoto();
    showToast(`Switched to ${state.car.nickname || state.car.model}`);
  } catch (err) {
    showToast('Switch failed: ' + (err?.message || 'unknown error'));
  } finally {
    state.isLoadingEntries = false;
    renderAll();
  }
}

// Apply the saved garage name (or the default) to every place it
// appears. Called once on boot and again whenever the user edits it in
// Settings.
export function applyGarageName(name) {
  state.garageName = (name || '').trim() || DEFAULT_GARAGE_NAME;
  document.title = state.garageName;
  const ids = ['garage-header-title', 'auth-brand-title', 'settings-footer-name'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = state.garageName; });
  const sub = document.getElementById('settings-garage-name-sub');
  if (sub) sub.textContent = state.garageName;
}

// ══════════════════════════════════════════════════════
// Car modal — add / edit
// ══════════════════════════════════════════════════════

// Reveal Sold date/price inputs only when status = sold; keeps the form
// uncluttered for the 99% case where the user is editing a car they
// still own.
function applyStatusMode() {
  const sold = document.getElementById('car-status').value === 'sold';
  document.getElementById('car-sold-fields').style.display = sold ? '' : 'none';
}

export function openCarModal(mode) {
  const isEdit = mode === 'edit';
  state.editingVehicleId = isEdit ? state.vehicleId : null;

  // Edit pre-fills from the active car. Add starts blank — no make is
  // pre-selected so we don't bias new users toward any particular brand.
  const src = isEdit ? state.car : { odoUnit:'km' };
  document.getElementById('car-year').value     = src.year     || '';
  carMakeInput.value                            = src.make     || '';
  document.getElementById('car-model-text').value   = src.model   || '';
  document.getElementById('car-chassis-text').value = src.chassis || '';
  document.getElementById('car-variant-text').value = src.variant || '';
  document.getElementById('car-colour').value   = src.colour   || '';
  document.getElementById('car-odo').value      = src.odo      || '';
  document.getElementById('car-odo-unit').value = src.odoUnit  || 'km';
  document.getElementById('car-fuel').value         = src.fuelType     || '';
  document.getElementById('car-drivetrain').value   = src.drivetrain   || '';
  document.getElementById('car-transmission').value = src.transmission || '';
  document.getElementById('car-nickname').value = src.nickname || '';
  document.getElementById('car-cc-consumption').value = src.combinedCycleConsumption || '';
  document.getElementById('car-status').value     = src.status   || 'active';
  document.getElementById('car-sold-date').value  = src.soldDate || '';
  document.getElementById('car-sold-price').value = src.soldPrice || '';
  applyStatusMode();

  carModalTitle.textContent = isEdit ? 'Car Details' : 'Add Vehicle';
  saveCarBtn.textContent    = isEdit ? 'Save Details' : 'Add Vehicle';
  // Delete only makes sense for an existing vehicle, so it's hidden in add mode.
  document.getElementById('delete-vehicle-btn').style.display = isEdit ? '' : 'none';
  carModal.classList.add('open');
}

// Create a brand-new vehicle and make it active. Used by the first-run
// onboarding wizard, which awaits behind a button spinner — so unlike the
// optimistic path in saveCarBtn there's no perceived lag to paper over.
// Throws on failure; the caller surfaces the error and keeps the wizard
// open so the user can retry without losing input.
export async function createVehicle(next) {
  const saved = await upsertVehicle({ ...next, id: null });
  state.vehicles.push(saved);
  setActiveVehicle(saved);
  state.entries   = [];
  state.fuelLogs  = [];
  state.documents = [];
  resetPhoto();
  renderAll();
  return saved;
}

// ══════════════════════════════════════════════════════
// "My Garage" — vehicle switcher
// ══════════════════════════════════════════════════════

// Confirm + delete a vehicle and everything hanging off it, then keep the
// UI coherent. If the deleted vehicle was the active one we reselect the
// first remaining vehicle (or reopen onboarding when the garage is now
// empty); deleting a background vehicle leaves the active car untouched.
// Shared by the garage-list trash button and the car-editor delete button.
// `onConfirmed` runs after the user accepts the prompt but before any work
// — the editor uses it to close its modal. Throws on failure; callers
// surface the toast.
async function deleteVehicleFlow(id, onConfirmed) {
  if (!id) return false;
  const target = state.vehicles.find(v => v.id === id);
  const tc = target ? rowToCar(target) : state.car;
  const label = tc.nickname || [tc.make, tc.model].filter(Boolean).join(' ') || 'this vehicle';
  if (!confirm(`Delete ${label}? This permanently removes all its logs, fuel, and documents. This cannot be undone.`)) return false;
  if (onConfirmed) onConfirmed();

  const wasActive = id === state.vehicleId;
  await deleteVehicle(id);
  state.vehicles = state.vehicles.filter(v => v.id !== id);

  // Background vehicle: the active car is untouched — just refresh the
  // open garage list and dashboard counts.
  if (!wasActive) {
    if (garageModal.classList.contains('open')) renderGarageList();
    renderAll();
    showToast(`${label} deleted`);
    return true;
  }

  // Active car removed and nothing left — back to first-run onboarding.
  if (!state.vehicles.length) {
    state.vehicleId = null;
    state.car = { year:'', make:'', model:'', body:'', engine:'', variant:'',
                  colour:'', odo:'', odoUnit:'km', nickname:'' };
    state.entries = [];
    state.fuelLogs = [];
    state.documents = [];
    localStorage.removeItem(ACTIVE_VEHICLE_KEY);
    resetPhoto();
    close(garageModal);
    renderAll();
    showToast('Vehicle deleted');
    openWizard();
    return true;
  }

  // Active car removed — fall back to the first remaining vehicle and
  // pull its data.
  const next = state.vehicles[0];
  setActiveVehicle(next);
  state.entries = [];
  state.fuelLogs = [];
  state.documents = [];
  state.isLoadingEntries = true;
  resetPhoto();
  if (garageModal.classList.contains('open')) renderGarageList();
  renderAll();
  try {
    [state.entries, state.fuelLogs, state.documents] = await Promise.all([
      loadEntries(state.vehicleId),
      loadFuelLogs(state.vehicleId),
      loadDocuments(state.vehicleId),
    ]);
    await loadSavedPhoto();
  } finally {
    state.isLoadingEntries = false;
    if (garageModal.classList.contains('open')) renderGarageList();
    renderAll();
  }
  showToast(`Vehicle deleted · switched to ${state.car.nickname || state.car.model}`);
  return true;
}

const TRASH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>';

export function renderGarageList() {
  garageList.innerHTML = '';
  state.vehicles.forEach(v => {
    const c = rowToCar(v);
    const isActive = v.id === state.vehicleId;
    const trailing = c.variant;
    const row = document.createElement('div');
    row.className = 'garage-row';
    const btn = document.createElement('button');
    btn.type = 'button';
    const lifecycleClass = c.status === 'sold' ? ' sold' : c.status === 'archived' ? ' archived' : '';
    btn.className = 'garage-item' + (isActive ? ' active' : '') + lifecycleClass;
    const subParts = [];
    if (c.year) subParts.push(c.year);
    if (c.make) subParts.push(c.make);
    if (c.colour) subParts.push(c.colour);
    // Active pill wins when it's the current car; otherwise show the
    // lifecycle state so the user can spot sold/archived vehicles at a
    // glance.
    let pill = '';
    if (isActive)                      pill = '<span class="garage-item-active-pill">Active</span>';
    else if (c.status === 'sold')      pill = '<span class="garage-item-sold-pill">Sold</span>';
    else if (c.status === 'archived')  pill = '<span class="garage-item-archived-pill">Archived</span>';
    const titleParts = [c.model, trailing].filter(Boolean).join(' ').trim();
    const name = c.nickname || titleParts || c.make || 'Vehicle';
    btn.innerHTML = `
      <div class="brand-logo brand-logo-sm" aria-hidden="true"></div>
      <div class="garage-item-info">
        <div class="garage-item-name">${name}</div>
        <div class="garage-item-sub">${subParts.filter(Boolean).join(' · ')}</div>
      </div>
      ${pill}
    `;
    renderBrandLogo(btn.querySelector('.brand-logo'), c.make);
    btn.onclick = async () => {
      close(garageModal);
      await switchVehicle(v.id);
    };

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'garage-item-delete';
    del.title = 'Delete vehicle';
    del.setAttribute('aria-label', `Delete ${name}`);
    del.innerHTML = TRASH_SVG;
    del.onclick = async () => {
      del.disabled = true;
      try {
        await deleteVehicleFlow(v.id);
      } catch (err) {
        showToast('Delete failed: ' + (err?.message || 'unknown error'));
        del.disabled = false;
      }
    };

    row.appendChild(btn);
    row.appendChild(del);
    garageList.appendChild(row);
  });
}

// ══════════════════════════════════════════════════════
// Top-level wiring — called once by main.js after DOM is ready
// ══════════════════════════════════════════════════════

export function wireVehicleHandlers() {
  document.getElementById('car-status').addEventListener('change', applyStatusMode);
  document.getElementById('car-edit-btn').onclick = () => openCarModal('edit');

  saveCarBtn.onclick = async () => {
    const make = carMakeInput.value.trim();
    if (!make) { showToast('Make is required'); return; }

    const model = document.getElementById('car-model-text').value.trim();
    if (!model) { showToast('Model is required'); return; }

    const next = {
      id:       state.editingVehicleId,  // null on create — upsertVehicle inserts
      year:     document.getElementById('car-year').value.trim(),
      make,
      model,
      chassis:  document.getElementById('car-chassis-text').value.trim(),
      variant:  document.getElementById('car-variant-text').value.trim(),
      colour:   document.getElementById('car-colour').value.trim(),
      odo:      document.getElementById('car-odo').value.trim(),
      odoUnit:  document.getElementById('car-odo-unit').value,
      fuelType:     document.getElementById('car-fuel').value,
      drivetrain:   document.getElementById('car-drivetrain').value,
      transmission: document.getElementById('car-transmission').value,
      nickname: document.getElementById('car-nickname').value.trim(),
      status:                   document.getElementById('car-status').value,
      soldDate:                 document.getElementById('car-sold-date').value,
      soldPrice:                document.getElementById('car-sold-price').value.trim(),
      combinedCycleConsumption: document.getElementById('car-cc-consumption').value.trim(),
    };

    // Optimistic save: mutate the in-memory state and close the modal
    // before the network call returns, then reconcile (or roll back)
    // once it does. close() doesn't clear the form, so on failure we
    // re-open the modal with the user's data still in place and let
    // them retry.
    const isNew = !state.editingVehicleId;
    const prevVehicles  = state.vehicles.slice();
    const prevCar       = { ...state.car };
    const prevVehicleId = state.vehicleId;
    const prevEntries   = state.entries.slice();
    const existingPath  = isNew ? null
      : (prevVehicles.find(v => v.id === state.editingVehicleId)?.photo_path || null);

    const tmpId = isNew ? 'tmp-' + Date.now() : state.editingVehicleId;
    const draftStatus = next.status === 'sold' || next.status === 'archived' ? next.status : 'active';
    const draftSoldPrice = parseFloat(next.soldPrice);
    const draftCcConsumption = parseFloat(next.combinedCycleConsumption);
    const draftRow = {
      id:            tmpId,
      nickname:      next.nickname
        || [next.model, next.variant].filter(Boolean).join(' ').trim()
        || `My ${next.make}`,
      make:          next.make,
      model:         next.model,
      year:          next.year ? parseInt(next.year, 10) : null,
      variant:       next.variant || null,
      colour:        next.colour || null,
      odometer:      next.odo ? parseInt(next.odo, 10) : null,
      odometer_unit: next.odoUnit || 'km',
      fuel_type:     next.fuelType     || null,
      drivetrain:    next.drivetrain   || null,
      transmission:  next.transmission || null,
      photo_path:    existingPath,
      status:        draftStatus,
      sold_date:     draftStatus === 'sold' && next.soldDate ? next.soldDate : null,
      sold_price:    draftStatus === 'sold' && Number.isFinite(draftSoldPrice) ? draftSoldPrice : null,
      combined_cycle_consumption: Number.isFinite(draftCcConsumption) ? draftCcConsumption : null,
    };

    if (isNew) {
      state.vehicles.push(draftRow);
      setActiveVehicle(draftRow);
      state.entries = [];
      resetPhoto();
    } else {
      const i = state.vehicles.findIndex(v => v.id === state.editingVehicleId);
      if (i !== -1) state.vehicles[i] = draftRow;
      state.car = rowToCar(draftRow);
    }
    close(carModal);
    renderAll();

    try {
      const saved = await upsertVehicle(next);
      const i = state.vehicles.findIndex(v => v.id === tmpId);
      if (i !== -1) state.vehicles[i] = saved;
      if (isNew)        setActiveVehicle(saved);
      else if (saved.id === state.vehicleId) state.car = rowToCar(saved);
      renderAll();
      showToast(isNew ? 'Vehicle added ✓' : 'Car details saved ✓');
    } catch (err) {
      // Roll back to the pre-save snapshot and re-open the modal so the
      // user can fix whatever went wrong without losing their input.
      state.vehicles  = prevVehicles;
      state.car       = prevCar;
      state.vehicleId = prevVehicleId;
      state.entries   = prevEntries;
      if (prevVehicleId) localStorage.setItem(ACTIVE_VEHICLE_KEY, prevVehicleId);
      renderAll();
      carModal.classList.add('open');
      showToast('Save failed: ' + (err?.message || 'unknown error'));
    }
  };

  document.getElementById('car-garage-btn').onclick = () => {
    renderGarageList();
    garageModal.classList.add('open');
  };

  document.getElementById('add-vehicle-btn').onclick = () => {
    close(garageModal);
    openCarModal('add');
  };

  document.getElementById('delete-vehicle-btn').onclick = async () => {
    const id = state.editingVehicleId;
    if (!id) return;
    const btn = document.getElementById('delete-vehicle-btn');
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      // Close the editor as soon as the user confirms so the dashboard
      // re-render (and any vehicle switch) isn't hidden behind the modal.
      await deleteVehicleFlow(id, () => close(carModal));
    } catch (err) {
      showToast('Delete failed: ' + (err?.message || 'unknown error'));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete this vehicle';
    }
  };
}
