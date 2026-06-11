// All the render* functions. renderAll() is the single entry point the
// rest of the app calls after any state mutation; the individual render
// functions are also used directly when only one screen needs refreshing
// (e.g. renderSpendScreen on scope change, renderDocumentsScreen on
// document add/delete).

import {
  state,
  fmt, fmtDate, formatBytes,
  typeIcons, typeLabels,
  SCOPE_LABELS,
  expiryStatus, docIcon,
  entriesInScope, fuelInScope,
} from './state.js';
import { renderBrandLogo } from '../logos.js';
import { renderVehicleCutout } from '../cars.js';
import {
  computeFuelEconomy,
  DOCUMENT_STORAGE_LIMIT_BYTES,
} from '../data.js';
import { openDocumentPreview } from './documents.js';

const detailModal = document.getElementById('detail-modal');

// ══════════════════════════════════════════════════════
// Car card (top of the Garage tab)
// ══════════════════════════════════════════════════════

export function renderCarCard() {
  const { year, make, model, variant, colour, odo, odoUnit, nickname,
          fuelType, drivetrain, transmission } = state.car;

  // Name: nickname > "Model Variant" > Model
  const displayName = nickname
    || [model, variant].filter(Boolean).join(' ').trim()
    || model
    || 'Add your first vehicle';
  document.getElementById('car-name-display').textContent = displayName;

  // Sub: "<year> <make> · <odo> · <colour>" — make is dynamic now.
  const parts = [];
  if (year && make) parts.push(`${year} ${make}`);
  else if (make)    parts.push(make);
  else if (year)    parts.push(year);
  if (odo)    parts.push(Number(odo).toLocaleString('en-AU') + ' ' + odoUnit);
  // Colour, fuel, drivetrain and transmission now live in the pill row below,
  // and the claimed economy shows on the fuel gauge — so the tagline stays the
  // car's identity line (year · make · odometer).
  document.getElementById('car-sub-display').textContent = parts.join(' · ') || '';

  // Badge: a MODEL · VARIANT spec chip when a trim is recorded, else MAKE · MODEL.
  const badge = document.getElementById('car-badge');
  if (model && variant) {
    badge.textContent = `${model} · ${variant}`.toUpperCase();
    badge.style.display = '';
  } else if (make && model) {
    badge.textContent = `${make} · ${model}`.toUpperCase();
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  renderBrandLogo(document.getElementById('car-brand-logo'), make);

  // Empty photo state keeps just the "add a photo" prompt — the brand emblem
  // already sits in the card head, so there's no need to repeat it on the stage.
  const promptSub = document.getElementById('upload-prompt-sub');
  if (promptSub) promptSub.textContent = make ? `Your ${make} · your build` : 'Your car, your build';

  // Spec pills: year is the gold lead pill, then the descriptive fields. Only
  // populated values render (built as DOM nodes so free-text colour is safe).
  const pillsEl = document.getElementById('car-pills');
  if (pillsEl) {
    const pills = [];
    if (year)         pills.push({ text: year, lead: true });
    if (fuelType)     pills.push({ text: fuelType });
    if (drivetrain)   pills.push({ text: drivetrain });
    if (transmission) pills.push({ text: transmission });
    if (colour)       pills.push({ text: colour });
    pillsEl.replaceChildren(...pills.map(p => {
      const span = document.createElement('span');
      span.className = 'pill' + (p.lead ? ' lead' : '');
      span.textContent = p.text;
      return span;
    }));
  }

  // Stage image precedence: a curated cutout is the hero whenever one exists
  // (.has-cutout hides the photo + prompt layers); otherwise the user's
  // uploaded photo; otherwise the "add a photo" prompt.
  const stageEl  = document.getElementById('car-image-wrap');
  const cutoutEl = document.getElementById('car-cutout');
  const hasCutout = renderVehicleCutout(cutoutEl, state.car);
  if (stageEl) stageEl.classList.toggle('has-cutout', hasCutout);

  // Lifecycle: when the active car is sold or archived, show a read-only
  // banner and dim the add-entry FAB (via body.car-sold). Edit + photo
  // remain available so the user can correct details or flip the status
  // back. Title carries the state name (in --red for sold, muted for
  // archived); detail line carries the handover info.
  const banner      = document.getElementById('sold-banner');
  const bannerTitle = document.getElementById('sold-banner-title');
  const bannerInfo  = document.getElementById('sold-banner-detail');
  if (state.car.status === 'sold') {
    const bits = [];
    if (state.car.soldDate)  bits.push(fmtDate(state.car.soldDate));
    if (state.car.soldPrice) bits.push(`$${Number(state.car.soldPrice).toLocaleString('en-AU')}`);
    bits.push('read-only history');
    bannerTitle.textContent = 'Sold';
    bannerInfo.textContent  = bits.join(' · ');
    banner.classList.add('open');
    banner.classList.remove('archived');
    document.body.classList.add('car-sold');
  } else if (state.car.status === 'archived') {
    bannerTitle.textContent = 'Archived';
    bannerInfo.textContent  = 'Read-only history';
    banner.classList.add('open', 'archived');
    document.body.classList.add('car-sold');
  } else {
    banner.classList.remove('open', 'archived');
    document.body.classList.remove('car-sold');
  }
}

// ══════════════════════════════════════════════════════
// Entry + fuel cards (and the shared detail modal)
// ══════════════════════════════════════════════════════

export function makeCard(entry) {
  const div = document.createElement('div');
  div.className = `entry-card ${entry.type}`;
  div.innerHTML = `
    <div class="entry-icon ${entry.type}">${typeIcons[entry.type]}</div>
    <div class="entry-content">
      <div class="entry-title">${entry.title}</div>
      <div class="entry-meta">${fmtDate(entry.date)}</div>
      <div class="entry-tags">
        <span class="tag ${entry.type}">${typeLabels[entry.type]}</span>
        ${entry.type === 'mod' && entry.category ? `<span class="tag mod">${entry.category}</span>` : ''}
        ${entry.notes ? '<span class="tag done">Notes</span>' : ''}
      </div>
    </div>
    <div class="entry-right"><div class="entry-cost">${fmt(entry.cost)}</div></div>
  `;
  div.onclick = () => {
    // The detail modal is shared with fuel entries — clear fuelDetailId
    // so the delete handler routes to deleteEntry, not deleteFuelLog.
    state.fuelDetailId = null;
    state.detailId = entry.id;
    document.getElementById('detail-title').textContent = entry.title;
    document.getElementById('detail-body').innerHTML = `
      <div class="detail-row"><span class="detail-key">Type</span><span class="tag ${entry.type}">${typeLabels[entry.type]}</span></div>
      ${entry.type === 'mod' && entry.category ? `<div class="detail-row"><span class="detail-key">Category</span><span class="detail-val">${entry.category}</span></div>` : ''}
      <div class="detail-row"><span class="detail-key">Date</span><span class="detail-val">${fmtDate(entry.date)}</span></div>
      <div class="detail-row"><span class="detail-key">Cost</span><span class="detail-val" style="color:var(--accent2);font-size:18px;font-weight:700">${fmt(entry.cost)}</span></div>
      ${entry.notes ? `<div class="detail-row" style="flex-direction:column;gap:8px;align-items:flex-start"><span class="detail-key">Notes</span><span class="detail-val" style="font-weight:300;line-height:1.6;text-align:left">${entry.notes}</span></div>` : ''}
    `;
    detailModal.classList.add('open');
  };
  return div;
}

// Fuel rows look like regular entries on the Spend tab, but carry
// odometer + litres on the detail view. Built as a dedicated card so the
// detail modal can show fuel-specific fields without forking makeCard's
// signature.
export function makeFuelCard(fuel) {
  const div = document.createElement('div');
  div.className = 'entry-card fuel';
  const title = fuel.station ? `Fuel — ${fuel.station}` : 'Fuel';
  div.innerHTML = `
    <div class="entry-icon fuel">⛽</div>
    <div class="entry-content">
      <div class="entry-title">${title}</div>
      <div class="entry-meta">${fmtDate(fuel.date)} · ${fuel.litres.toFixed(2)} L · ${fuel.odometer.toLocaleString('en-AU')} km</div>
      <div class="entry-tags">
        <span class="tag fuel">Fuel</span>
        ${fuel.isFullTank ? '' : '<span class="tag">Partial</span>'}
        ${fuel.notes ? '<span class="tag done">Notes</span>' : ''}
      </div>
    </div>
    <div class="entry-right"><div class="entry-cost">${fmt(fuel.totalCost)}</div></div>
  `;
  div.onclick = () => openFuelDetail(fuel);
  return div;
}

export function openFuelDetail(fuel) {
  state.fuelDetailId = fuel.id;
  state.detailId = null;  // fuel + entry detail share the modal — disambiguate via fuelDetailId
  const title = fuel.station ? `Fuel — ${fuel.station}` : 'Fuel';
  document.getElementById('detail-title').textContent = title;
  const lp100 = fuel.litres > 0 && fuel.totalCost > 0 ? (fuel.totalCost / fuel.litres) : null;
  document.getElementById('detail-body').innerHTML = `
    <div class="detail-row"><span class="detail-key">Type</span><span class="tag fuel">Fuel${fuel.isFullTank ? '' : ' (partial)'}</span></div>
    <div class="detail-row"><span class="detail-key">Date</span><span class="detail-val">${fmtDate(fuel.date)}</span></div>
    <div class="detail-row"><span class="detail-key">Odometer</span><span class="detail-val">${fuel.odometer.toLocaleString('en-AU')} km</span></div>
    <div class="detail-row"><span class="detail-key">Litres</span><span class="detail-val">${fuel.litres.toFixed(2)} L</span></div>
    <div class="detail-row"><span class="detail-key">Cost</span><span class="detail-val" style="color:var(--accent2);font-size:18px;font-weight:700">${fmt(fuel.totalCost)}</span></div>
    ${lp100 ? `<div class="detail-row"><span class="detail-key">Price / L</span><span class="detail-val">$${lp100.toFixed(2)}</span></div>` : ''}
    ${fuel.notes ? `<div class="detail-row" style="flex-direction:column;gap:8px;align-items:flex-start"><span class="detail-key">Notes</span><span class="detail-val" style="font-weight:300;line-height:1.6;text-align:left">${fuel.notes}</span></div>` : ''}
  `;
  detailModal.classList.add('open');
}

// ══════════════════════════════════════════════════════
// Lists + lifetime stats
// ══════════════════════════════════════════════════════

export function renderList(id, filter) {
  const el   = document.getElementById(id);
  const list = filter ? state.entries.filter(e => e.type === filter) : state.entries;
  const icons = {'recent-entries':'🔧','mod-entries':'⚙️','service-entries':'🛠️','spend-entries':'💰'};
  if (!list.length) {
    if (state.isLoadingEntries) {
      el.innerHTML = `<div class="empty"><div class="list-spinner"></div><div class="empty-text">Loading…</div></div>`;
    } else {
      el.innerHTML = `<div class="empty"><div class="empty-icon">${icons[id] || '🔧'}</div><div class="empty-text">No entries yet.</div></div>`;
    }
    return;
  }
  el.innerHTML = '';
  list.forEach(e => el.appendChild(makeCard(e)));
}

// Garage-card stats — lifetime numbers for "this car so far," independent
// of the Spend tab's time scope. Keeping these all-time matches user
// intuition that the badge on your garage card represents the whole car.
export function renderStats() {
  const mod = state.entries.filter(e => e.type === 'mod');
  const svc = state.entries.filter(e => e.type === 'service');
  const total = state.entries.reduce((s, e) => s + e.cost, 0);
  document.getElementById('stat-mods').textContent  = mod.length;
  document.getElementById('stat-spent').textContent = fmt(total);
  const lastSvc = [...svc].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const el = document.getElementById('stat-service');
  // No service history yet is a neutral state, not a problem — a fresh car
  // shouldn't show an alarming red "None". Only go red once there's a
  // baseline and it's actually overdue.
  if (!lastSvc) { el.textContent = '—'; el.className = 'stat-val'; }
  else {
    const days = (Date.now() - new Date(lastSvc.date)) / 86400000;
    el.textContent = days > 180 ? 'Due' : 'OK';
    el.className   = 'stat-val ' + (days > 180 ? 'overdue' : 'good');
  }
}

// ══════════════════════════════════════════════════════
// Spend screen — scope-aware visuals
// ══════════════════════════════════════════════════════

// Renders every visual on the Spend screen against the active scope:
// hero total, stacked bar, type breakdown, biggest-mod callout, category
// bars, and the scope-filtered transactions list.
export function renderSpendScreen() {
  const scoped = entriesInScope();
  const fuelScoped = fuelInScope();
  const mod = scoped.filter(e => e.type === 'mod');
  const svc = scoped.filter(e => e.type === 'service');
  const rep = scoped.filter(e => e.type === 'repair');
  const modTotal  = mod.reduce((s, e) => s + e.cost, 0);
  const svcTotal  = svc.reduce((s, e) => s + e.cost, 0);
  const repTotal  = rep.reduce((s, e) => s + e.cost, 0);
  const fuelTotal = fuelScoped.reduce((s, f) => s + (f.totalCost || 0), 0);
  const total     = modTotal + svcTotal + repTotal + fuelTotal;

  // Hero numbers + scope label
  document.getElementById('spend-scope-label').textContent = SCOPE_LABELS[state.spendScope];
  document.getElementById('total-spend').textContent   = fmt(total);
  document.getElementById('spend-mods').textContent    = fmt(modTotal);
  document.getElementById('spend-service').textContent = fmt(svcTotal);
  document.getElementById('spend-repair').textContent  = fmt(repTotal);
  document.getElementById('spend-fuel').textContent    = fmt(fuelTotal);

  // Stacked proportion bar — only render segments that have spend.
  const stack = document.getElementById('spend-stack');
  stack.replaceChildren();
  if (total > 0) {
    [
      { type: 'mod', val: modTotal },
      { type: 'service', val: svcTotal },
      { type: 'repair', val: repTotal },
      { type: 'fuel', val: fuelTotal },
    ].filter(s => s.val > 0).forEach(s => {
      const seg = document.createElement('div');
      seg.className = `spend-stack-seg ${s.type}`;
      seg.style.flexGrow = String(s.val);
      stack.appendChild(seg);
    });
  }

  // Biggest mod callout — single most expensive mod in scope, if any.
  const card = document.getElementById('biggest-mod-card');
  if (mod.length) {
    const biggest = [...mod].sort((a, b) => b.cost - a.cost)[0];
    card.style.display = '';
    document.getElementById('biggest-mod-title').textContent = biggest.title;
    document.getElementById('biggest-mod-cost').textContent  = fmt(biggest.cost);
    const meta = [];
    if (biggest.category) meta.push(biggest.category);
    meta.push(fmtDate(biggest.date));
    document.getElementById('biggest-mod-meta').textContent  = meta.join(' · ');
    document.getElementById('biggest-mod-scope').textContent = `(${SCOPE_LABELS[state.spendScope].toLowerCase()})`;
  } else {
    card.style.display = 'none';
  }

  // Category breakdown — sums mod cost by category, sorted desc. Bar
  // fill is scaled to the leading category so the top row always reads
  // 100%.
  const catTotals = mod.reduce((acc, e) => {
    const key = e.category || 'Uncategorised';
    acc[key] = (acc[key] || 0) + e.cost;
    return acc;
  }, {});
  const catRows = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const catEl = document.getElementById('category-breakdown');
  catEl.replaceChildren();
  if (!catRows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<div class="empty-text">No mods in this period.</div>';
    catEl.appendChild(empty);
  } else {
    const leader = catRows[0][1];
    for (const [name, amount] of catRows) {
      const pctOfMods = modTotal > 0 ? Math.round((amount / modTotal) * 100) : 0;
      const fillPct   = leader   > 0 ? Math.round((amount / leader)   * 100) : 0;
      const row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML = `
        <div class="category-row-top">
          <div class="category-name"><span class="name-text"></span> <span class="muted">${pctOfMods}%</span></div>
          <div class="category-amount">${fmt(amount)}</div>
        </div>
        <div class="category-bar-track"><div class="category-bar-fill" style="width: ${fillPct}%"></div></div>
      `;
      row.querySelector('.name-text').textContent = name;
      catEl.appendChild(row);
    }
  }

  // Transactions list — scope-aware. Merge entry + fuel rows by date so
  // they interleave in the order they happened, not bunched by type.
  const txEl = document.getElementById('spend-entries');
  const merged = [
    ...scoped.map(e => ({ kind: 'entry', date: e.date, payload: e })),
    ...fuelScoped.map(f => ({ kind: 'fuel',  date: f.date, payload: f })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (!merged.length) {
    if (state.isLoadingEntries) {
      txEl.innerHTML = `<div class="empty"><div class="list-spinner"></div><div class="empty-text">Loading…</div></div>`;
    } else {
      txEl.innerHTML = `<div class="empty"><div class="empty-icon">💰</div><div class="empty-text">No spend in this period.</div></div>`;
    }
  } else {
    txEl.replaceChildren();
    merged.forEach(row => {
      txEl.appendChild(row.kind === 'fuel' ? makeFuelCard(row.payload) : makeCard(row.payload));
    });
  }
}

// ══════════════════════════════════════════════════════
// Fuel economy gauge
// ══════════════════════════════════════════════════════
// SVG arcs sweep 180° from (10,120) on the left, over (110,20) at the
// top, to (210,120) on the right — radius 100, centre (110,120). A
// fraction f (0..1) of the L/100km range maps to angle θ = (f − 0.5)·π,
// with the arc point at (110 + 100·sin θ, 120 − 100·cos θ). The needle
// uses the same θ but applied via SVG rotation around the centre.

function gaugeArcPoint(f) {
  const theta = (f - 0.5) * Math.PI;
  return {
    x: 110 + 100 * Math.sin(theta),
    y: 120 - 100 * Math.cos(theta),
  };
}

function gaugeArcPath(fStart, fEnd) {
  if (fEnd <= fStart) return '';
  const a = gaugeArcPoint(fStart);
  const b = gaugeArcPoint(fEnd);
  // large-arc=0 (always < 180° since fEnd−fStart ≤ 1), sweep=1 (clockwise,
  // which traces the top semicircle from left to right).
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A 100 100 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function renderFuelCard() {
  const valueEl    = document.getElementById('fuel-gauge-value');
  const readoutEl  = document.getElementById('fuel-gauge-readout');
  const emptyEl    = document.getElementById('fuel-gauge-empty');
  const statsEl    = document.getElementById('fuel-card-stats');
  const anchorEl   = document.getElementById('fuel-anchor-label');
  const greenArc   = document.getElementById('fuel-zone-green');
  const amberArc   = document.getElementById('fuel-zone-amber');
  const redArc     = document.getElementById('fuel-zone-red');
  const idleArc    = document.getElementById('fuel-zone-idle');
  const needle     = document.getElementById('fuel-needle');

  // No vehicle yet → hide the card entirely. renderCarCard does the same
  // for the rest of the dashboard.
  const card = document.getElementById('fuel-card');
  if (!state.vehicleId) { card.style.display = 'none'; return; }
  card.style.display = '';

  const { samples, rolling } = computeFuelEconomy(state.fuelLogs);
  const claim = parseFloat(state.car.combinedCycleConsumption);
  const hasClaim = Number.isFinite(claim) && claim > 0;
  const anchor = hasClaim ? claim : rolling;

  // Empty / partial states — replace the readout text but still draw a
  // muted arc so the card has visual presence on day one.
  if (!state.fuelLogs.length) {
    valueEl.textContent = '—';
    valueEl.classList.add('muted');
    readoutEl.style.display = 'none';
    statsEl.style.display = 'none';
    emptyEl.style.display = '';
    emptyEl.innerHTML = `<strong>No fill-ups yet</strong>Log your first fuel-up to start tracking L/100km.`;
    anchorEl.innerHTML = hasClaim ? `Spec: <strong>${claim.toFixed(1)}</strong> L/100km` : '';
    // Draw an idle arc and reset the needle to the centre.
    greenArc.setAttribute('d', '');
    amberArc.setAttribute('d', '');
    redArc.setAttribute('d', '');
    idleArc.setAttribute('d', gaugeArcPath(0, 1));
    idleArc.style.display = '';
    needle.style.transform = 'rotate(0deg)';
    return;
  }

  // ≥1 fill but no complete tank-to-tank pair → encourage another full tank.
  if (!samples.length && !hasClaim) {
    valueEl.textContent = '—';
    valueEl.classList.add('muted');
    readoutEl.style.display = 'none';
    statsEl.style.display = '';
    emptyEl.style.display = '';
    emptyEl.innerHTML = `<strong>One more full tank to go</strong>L/100km needs two consecutive full tank-ups to compute.`;
    anchorEl.textContent = '';
    greenArc.setAttribute('d', '');
    amberArc.setAttribute('d', '');
    redArc.setAttribute('d', '');
    idleArc.setAttribute('d', gaugeArcPath(0, 1));
    idleArc.style.display = '';
    needle.style.transform = 'rotate(0deg)';
    renderFuelStats(samples, rolling);
    return;
  }

  // Full computation: anchor exists (claim or rolling), gauge is "live".
  // Pick a max for the dial: keep room above both the current rolling
  // avg and the anchor's red zone so the needle is never pegged. Floor
  // at 15 so small-car gauges still feel proportional.
  const needleValue = rolling != null ? rolling : anchor;
  const max = Math.max(needleValue * 1.4, anchor * 1.8, 15);

  // Zone boundaries: green up to anchor (meeting or beating it), amber
  // from anchor to +20%, red above. Anchor-as-green-edge means hitting
  // spec visually reads as a win — the brief frames the gauge as "am I
  // beating spec?", not "am I within ±20% of spec?"
  const greenEnd = Math.min(anchor / max, 1);
  const amberEnd = Math.min(anchor * 1.2 / max, 1);
  greenArc.setAttribute('d', gaugeArcPath(0, greenEnd));
  amberArc.setAttribute('d', gaugeArcPath(greenEnd, amberEnd));
  redArc.setAttribute('d', gaugeArcPath(amberEnd, 1));
  idleArc.style.display = 'none';

  // Needle: clamp inside the dial so an extreme reading still points at
  // the red end rather than swinging off-screen.
  const f = Math.max(0, Math.min(1, needleValue / max));
  const angleDeg = (f - 0.5) * 180;
  needle.style.transform = `rotate(${angleDeg.toFixed(2)}deg)`;

  if (rolling != null) {
    valueEl.textContent = rolling.toFixed(1);
    valueEl.classList.remove('muted');
    readoutEl.style.display = '';
    emptyEl.style.display = 'none';
  } else {
    // Claim-anchored but no rolling avg yet (single full tank logged).
    valueEl.textContent = '—';
    valueEl.classList.add('muted');
    readoutEl.style.display = 'none';
    emptyEl.style.display = '';
    emptyEl.innerHTML = `<strong>One more full tank to go</strong>L/100km needs two consecutive full tank-ups to compute.`;
  }

  anchorEl.innerHTML = hasClaim
    ? `Spec: <strong>${claim.toFixed(1)}</strong> L/100km`
    : `<strong>Your rolling avg</strong>`;

  statsEl.style.display = '';
  renderFuelStats(samples, rolling);
}

function renderFuelStats(samples, rolling) {
  const lastEl  = document.getElementById('fuel-stat-last');
  const tanksEl = document.getElementById('fuel-stat-tanks');
  const costEl  = document.getElementById('fuel-stat-cost');
  const sortedByDate = [...state.fuelLogs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = sortedByDate[0];
  if (latest) {
    const days = Math.floor((Date.now() - new Date(latest.date + 'T00:00:00')) / 86400000);
    lastEl.textContent = days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`;
  } else {
    lastEl.textContent = '—';
  }
  tanksEl.textContent = String(state.fuelLogs.length);
  const totalCost = state.fuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0);
  costEl.textContent = state.fuelLogs.length ? fmt(totalCost / state.fuelLogs.length) : '$0';
}

// ══════════════════════════════════════════════════════
// Documents (Glovebox tab) — list + storage meter
// ══════════════════════════════════════════════════════

export function renderStorageMeter() {
  const used = state.userStorageBytes || 0;
  const limit = DOCUMENT_STORAGE_LIMIT_BYTES;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const usedEl = document.getElementById('doc-storage-used');
  const limitEl = document.getElementById('doc-storage-limit');
  const barEl = document.getElementById('doc-storage-bar');
  if (!usedEl || !limitEl || !barEl) return;
  usedEl.textContent = formatBytes(used);
  limitEl.textContent = formatBytes(limit);
  barEl.style.width = pct + '%';
  barEl.classList.toggle('warn', pct >= 90);
}

export function renderDocumentsScreen() {
  renderStorageMeter();
  const list = document.getElementById('document-entries');
  if (!list) return;

  if (!state.vehicleId) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">📁</div><div class="empty-text">Add a vehicle in the Garage tab to start uploading documents.</div></div>';
    return;
  }
  if (!state.documents.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">📁</div><div class="empty-text">No documents yet.<br>Tap + to upload insurance, rego, receipts and more.</div></div>';
    return;
  }

  // Sort: documents with an expiry asc (urgency at the top), then
  // undated docs by created_at desc. The DB sort is the same, but
  // re-sorting here keeps the UI consistent if a doc is added in-memory
  // before reload.
  const sorted = [...state.documents].sort((a, b) => {
    if (a.expiryDate && b.expiryDate) return a.expiryDate < b.expiryDate ? -1 : 1;
    if (a.expiryDate) return -1;
    if (b.expiryDate) return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  list.replaceChildren(...sorted.map(d => {
    const exp = expiryStatus(d.expiryDate);
    const card = document.createElement('div');
    card.className = 'doc-card';
    card.dataset.id = d.id;
    const expiryHtml = exp.status
      ? `<span class="doc-expiry-pill ${exp.status}">${exp.label}</span>`
      : '';
    card.innerHTML = `
      <div class="doc-icon">${docIcon(d.type)}</div>
      <div class="doc-content">
        <div class="doc-title"></div>
        <div class="doc-meta">
          <span class="doc-type-pill">${d.type}</span>
          ${expiryHtml}
          <span>${formatBytes(d.fileSizeBytes)}</span>
        </div>
      </div>
    `;
    // Set title via textContent so user-entered strings can't inject HTML.
    card.querySelector('.doc-title').textContent = d.title;
    card.addEventListener('click', () => openDocumentPreview(d.id));
    return card;
  }));
}

// ══════════════════════════════════════════════════════
// Bottom-nav clearance
// ══════════════════════════════════════════════════════
// The fixed bottom nav can hide the last list item behind it. Body
// padding-bottom looks like the obvious fix, but body has height:100%
// which clamps its padding inside a fixed-height box — the padding
// doesn't extend the scrollable area. So we apply the clearance to
// `.entries` instead, which is a real content element whose padding
// genuinely grows the scroll height and pushes the last card up.
//
// Measure the nav's actual rendered height at runtime (it varies with
// iPhone home indicator, safe-area inset, font scaling, iOS URL bar
// state) and set every .entries list's padding-bottom = nav height + 48px.
// The Math.max floor keeps a safe minimum even when the nav reports a
// small offsetHeight (Chrome responsive mode, no safe-area).

export function syncNavClearance() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const measured = nav.offsetHeight + 48;
  const padding  = Math.max(measured, 160) + 'px';
  document.querySelectorAll('.entries').forEach(el => {
    el.style.paddingBottom = padding;
  });
}

// ══════════════════════════════════════════════════════
// Top-level orchestrator — call after any state mutation
// ══════════════════════════════════════════════════════

export function renderAll() {
  renderCarCard(); renderStats();
  renderFuelCard();
  renderList('recent-entries', null);
  renderList('mod-entries',    'mod');
  renderList('service-entries','service');
  renderSpendScreen();
  renderDocumentsScreen();
}
