// Vehicle + garage: loadAll, switching, the Add/Edit car modal, and the
// "My Garage" picker. Everything that mutates state.vehicles or
// state.car lives here.

import {
  state, ACTIVE_VEHICLE_KEY,
  isBMW, showToast, close,
} from './state.js';
import {
  loadVehicles, upsertVehicle, rowToCar,
  loadEntries, loadFuelLogs, loadDocuments,
  getUserStorageUsageBytes,
  DEFAULT_GARAGE_NAME,
} from '../data.js';
import { renderBrandLogo } from '../logos.js';
import { renderAll } from './render.js';
import { loadSavedPhoto, resetPhoto } from './photo.js';

const carModal      = document.getElementById('car-modal');
const garageModal   = document.getElementById('garage-modal');
const garageList    = document.getElementById('garage-list');
const carModalTitle = document.querySelector('#car-modal .modal-title');
const saveCarBtn    = document.getElementById('save-car-btn');
const carBmwFields     = document.getElementById('car-bmw-fields');
const carGenericFields = document.getElementById('car-generic-fields');
const carMakeInput     = document.getElementById('car-make');

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

// Show the chassis/body/engine dropdowns for BMW, plain text inputs for
// everything else. Driven by the Make field's current value.
function applyMakeMode() {
  const bmw = isBMW(carMakeInput.value);
  carBmwFields.style.display     = bmw ? '' : 'none';
  carGenericFields.style.display = bmw ? 'none' : '';
}

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
  // BMW dropdowns: keep their current select option if the saved value
  // matches, otherwise let the select default to its first <option>.
  document.getElementById('car-model').value    = src.model    || '530i';
  document.getElementById('car-body').value     = src.body     || 'Sedan';
  document.getElementById('car-engine').value   = src.engine   || 'M54';
  // Generic text inputs share the same column but use different state
  // fields.
  document.getElementById('car-model-text').value   = isBMW(src.make) ? '' : (src.model || '');
  document.getElementById('car-variant-text').value = src.variant || '';
  document.getElementById('car-colour').value   = src.colour   || '';
  document.getElementById('car-odo').value      = src.odo      || '';
  document.getElementById('car-odo-unit').value = src.odoUnit  || 'km';
  document.getElementById('car-nickname').value = src.nickname || '';
  document.getElementById('car-cc-consumption').value = src.combinedCycleConsumption || '';
  document.getElementById('car-status').value     = src.status   || 'active';
  document.getElementById('car-sold-date').value  = src.soldDate || '';
  document.getElementById('car-sold-price').value = src.soldPrice || '';
  applyStatusMode();

  applyMakeMode();
  carModalTitle.textContent = isEdit ? 'Car Details' : 'Add Vehicle';
  saveCarBtn.textContent    = isEdit ? 'Save Details' : 'Add Vehicle';
  carModal.classList.add('open');
}

// ══════════════════════════════════════════════════════
// "My Garage" — vehicle switcher
// ══════════════════════════════════════════════════════

export function renderGarageList() {
  garageList.innerHTML = '';
  state.vehicles.forEach(v => {
    const c = rowToCar(v);
    const isActive = v.id === state.vehicleId;
    const bmw = isBMW(c.make);
    const trailing = bmw ? c.body : c.variant;
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
    btn.innerHTML = `
      <div class="brand-logo brand-logo-sm" aria-hidden="true"></div>
      <div class="garage-item-info">
        <div class="garage-item-name">${c.nickname || titleParts || c.make || 'Vehicle'}</div>
        <div class="garage-item-sub">${subParts.filter(Boolean).join(' · ')}</div>
      </div>
      ${pill}
    `;
    renderBrandLogo(btn.querySelector('.brand-logo'), c.make);
    btn.onclick = async () => {
      close(garageModal);
      await switchVehicle(v.id);
    };
    garageList.appendChild(btn);
  });
}

// ══════════════════════════════════════════════════════
// Top-level wiring — called once by main.js after DOM is ready
// ══════════════════════════════════════════════════════

export function wireVehicleHandlers() {
  carMakeInput.addEventListener('input', applyMakeMode);
  document.getElementById('car-status').addEventListener('change', applyStatusMode);
  document.getElementById('car-edit-btn').onclick = () => openCarModal('edit');

  saveCarBtn.onclick = async () => {
    const make = carMakeInput.value.trim();
    if (!make) { showToast('Make is required'); return; }

    const bmw = isBMW(make);
    const model = bmw
      ? document.getElementById('car-model').value
      : document.getElementById('car-model-text').value.trim();
    if (!model) { showToast('Model is required'); return; }

    const next = {
      id:       state.editingVehicleId,  // null on create — upsertVehicle inserts
      year:     document.getElementById('car-year').value.trim(),
      make,
      model,
      // BMW preserves chassis/body/engine; other makes carry a free-text variant.
      body:     bmw ? document.getElementById('car-body').value   : null,
      engine:   bmw ? document.getElementById('car-engine').value : null,
      variant:  bmw ? '' : document.getElementById('car-variant-text').value.trim(),
      colour:   document.getElementById('car-colour').value.trim(),
      odo:      document.getElementById('car-odo').value.trim(),
      odoUnit:  document.getElementById('car-odo-unit').value,
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
        || [next.model, next.body].filter(Boolean).join(' ').trim()
        || `My ${next.make}`,
      make:          next.make,
      model:         next.model,
      year:          next.year ? parseInt(next.year, 10) : null,
      variant:       next.variant || null,
      body:          next.body   || null,
      engine:        next.engine || null,
      colour:        next.colour || null,
      odometer:      next.odo ? parseInt(next.odo, 10) : null,
      odometer_unit: next.odoUnit || 'km',
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
}
