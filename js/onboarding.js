// First-run onboarding wizard. Shown only when a signed-in user has zero
// vehicles (bootApp + the FAB's no-vehicle path both route here). Three
// steps: welcome → manufacturer picker → quick details. On finish it
// creates the vehicle via vehicle.js#createVehicle and drops the user on
// their freshly-populated garage dashboard.
//
// This is intentionally lighter than the full Car Details modal: make +
// model are the only required fields, and BMW-specific chassis/engine
// pickers are skipped — the user can refine all of that later via the
// Edit modal. The goal is the shortest possible path from sign-up to a
// working garage.

import { showToast, close } from './state.js';
import { PICKER_MAKES, renderBrandLogo } from '../logos.js';
import { createVehicle } from './vehicle.js';

const overlay = document.getElementById('wizard-overlay');

// Module-local wizard state — deliberately not on the shared `state`
// object since none of it outlives the wizard.
let chosenMake = '';
let manualMode = false;
let gridBuilt  = false;

function goToStep(n) {
  overlay.querySelectorAll('.wizard-step').forEach(s =>
    s.classList.toggle('active', Number(s.dataset.step) === n));
  overlay.querySelectorAll('.wizard-dot').forEach((d, i) =>
    d.classList.toggle('active', i < n));
  overlay.scrollTo(0, 0);
}

// Logos are <img> tags that load lazily, so building the grids is cheap to
// defer until the wizard is actually opened (most returning users never
// see it). Guarded so we only build once per session.
function buildGrids() {
  if (gridBuilt) return;
  gridBuilt = true;

  // Step 1 logo wall — a breadth signal, first 12 brands.
  const wall = document.getElementById('wizard-logo-wall');
  PICKER_MAKES.slice(0, 12).forEach(make => {
    const cell = document.createElement('div');
    cell.className = 'brand-logo';
    renderBrandLogo(cell, make);
    wall.appendChild(cell);
  });

  // Step 2 picker grid — every brand, tappable, alphabetical. (The wall above
  // stays in popularity order as a curated breadth signal.)
  const grid = document.getElementById('wizard-make-grid');
  const sorted = [...PICKER_MAKES].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  sorted.forEach(make => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wizard-make';
    btn.dataset.name = make.toLowerCase();
    // Logo-only tile (no caption) so the emblem can fill the cell. The make
    // name lives on aria-label + title for screen readers and hover tooltips.
    btn.setAttribute('aria-label', make);
    btn.title = make;
    btn.innerHTML = '<span class="brand-logo" aria-hidden="true"></span>';
    renderBrandLogo(btn.querySelector('.brand-logo'), make);
    btn.onclick = () => chooseMake(make);
    grid.appendChild(btn);
  });
}

function filterMakes(q) {
  const term = q.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('#wizard-make-grid .wizard-make').forEach(btn => {
    const match = !term || btn.dataset.name.includes(term);
    btn.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  document.getElementById('wizard-no-makes').style.display = visible ? 'none' : '';
}

function chooseMake(make) {
  chosenMake = make;
  manualMode = false;
  document.getElementById('wizard-make-manual-group').style.display = 'none';
  document.getElementById('wizard-chosen').style.display = '';
  document.getElementById('wizard-chosen-make').textContent = make;
  renderBrandLogo(document.getElementById('wizard-chosen-logo'), make);
  goToStep(3);
}

function chooseManual() {
  chosenMake = '';
  manualMode = true;
  document.getElementById('wizard-chosen').style.display = 'none';
  document.getElementById('wizard-make-manual-group').style.display = '';
  goToStep(3);
  document.getElementById('wizard-make-manual').focus();
}

async function finish() {
  const make = (manualMode
    ? document.getElementById('wizard-make-manual').value
    : chosenMake).trim();
  const model = document.getElementById('wizard-model').value.trim();
  if (!make)  { showToast('Pick or enter a make'); return; }
  if (!model) { showToast('Model is required'); return; }

  const btn = document.getElementById('wizard-finish');
  btn.disabled = true;
  btn.classList.add('wizard-finish-spin');
  btn.textContent = 'Creating…';
  try {
    await createVehicle({
      make,
      model,
      year:     document.getElementById('wizard-year').value.trim(),
      colour:   document.getElementById('wizard-colour').value.trim(),
      nickname: document.getElementById('wizard-nickname').value.trim(),
      odoUnit:  'km',
      status:   'active',
    });
    close(overlay);
    showToast('Welcome to your garage 🔧');
  } catch (err) {
    // Leave the wizard open with the user's input intact so they can retry.
    showToast('Couldn’t create: ' + (err?.message || 'unknown error'));
  } finally {
    btn.disabled = false;
    btn.classList.remove('wizard-finish-spin');
    btn.textContent = 'Create my garage';
  }
}

// Reset to a clean step 1 and show the overlay. Called by main.js (boot)
// and the FAB when the garage is empty.
export function openWizard() {
  buildGrids();
  chosenMake = '';
  manualMode = false;
  ['wizard-model', 'wizard-year', 'wizard-colour', 'wizard-nickname',
   'wizard-make-manual', 'wizard-make-search'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filterMakes('');
  goToStep(1);
  overlay.classList.add('open');
}

export function wireOnboardingHandlers() {
  document.getElementById('wizard-start').onclick      = () => goToStep(2);
  document.getElementById('wizard-make-other').onclick = chooseManual;
  document.getElementById('wizard-finish').onclick     = finish;
  document.getElementById('wizard-make-search').addEventListener('input', e => filterMakes(e.target.value));
  overlay.querySelectorAll('[data-back]').forEach(b =>
    b.addEventListener('click', () => {
      const step = Number(b.closest('.wizard-step').dataset.step);
      goToStep(step - 1);
    }));
  // No vehicle yet → the only way out is to finish or log out. Delegate to
  // the existing user-bar logout control (it's hidden behind the overlay
  // but its handler is live) so a user who deleted their last car isn't
  // locked in.
  document.getElementById('wizard-logout').onclick = () =>
    document.getElementById('user-bar-logout').click();
}
