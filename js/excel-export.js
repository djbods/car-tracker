// Multi-sheet .xlsx export via xlsx-js-style (community SheetJS fork
// that preserves cell `s` style on write — vanilla xlsx silently strips
// it). Orange brand palette mirrors the in-app accent so the export
// feels like the product.

import { state } from './state.js';
import {
  loadEntries, loadFuelLogs, loadDocuments,
} from '../data.js';

// ══════════════════════════════════════════════════════
// Brand palette (matches in-app orange accent)
// ══════════════════════════════════════════════════════

const STYLE_BORDER = {
  top:    { style: 'thin', color: { rgb: 'E5E5E5' } },
  bottom: { style: 'thin', color: { rgb: 'E5E5E5' } },
  left:   { style: 'thin', color: { rgb: 'E5E5E5' } },
  right:  { style: 'thin', color: { rgb: 'E5E5E5' } },
};
const STYLE_HEADER = {
  font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill:      { fgColor: { rgb: 'FF7E00' } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border:    STYLE_BORDER,
};
const STYLE_SECTION = {
  font:      { bold: true, color: { rgb: 'FF7E00' }, sz: 12 },
  alignment: { horizontal: 'left', vertical: 'center' },
};
const STYLE_LABEL  = { font: { bold: true }, alignment: { vertical: 'center' } };
const STYLE_BAND   = { fgColor: { rgb: 'FAFAF9' } };
const STYLE_TOTAL  = {
  font:   { bold: true },
  fill:   { fgColor: { rgb: 'FFF1E6' } },
  border: { ...STYLE_BORDER, top: { style: 'medium', color: { rgb: 'FF7E00' } } },
};

// Cell helpers — return SheetJS cell objects with type, value, format, style.
const money = v => ({ t: 'n', v: Number(v) || 0, z: '"$"#,##0.00' });
const num   = (v, z) => ({ t: 'n', v: Number(v) || 0, z });
// ISO date string → real Excel date cell. Parsed as local date to avoid
// the UTC-midnight-shifts-a-day-back gotcha in negative-offset timezones.
const dateCell = s => {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return s;
  return { t: 'd', v: new Date(y, m - 1, d), z: 'yyyy-mm-dd' };
};

// Walk every cell in the sheet, merge per-cell styling (banding + borders).
// `headerRows` are the rows above the data band that get the header style.
function styleTabularSheet(XLSX, ws, { headerRows = 1, totalRow = null } = {}) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) continue;
      if (r < headerRows) {
        cell.s = { ...(cell.s || {}), ...STYLE_HEADER };
      } else if (totalRow != null && r === totalRow) {
        cell.s = { ...(cell.s || {}), ...STYLE_TOTAL };
      } else {
        const banded = (r - headerRows) % 2 === 1;
        cell.s = {
          ...(cell.s || {}),
          border:    STYLE_BORDER,
          alignment: { vertical: 'center', wrapText: true, ...(cell.s?.alignment || {}) },
          ...(banded ? { fill: STYLE_BAND } : {}),
        };
      }
    }
  }
  // Freeze the header row so it stays put when scrolling long sheets.
  ws['!freeze'] = { xSplit: 0, ySplit: headerRows };
  // Click-to-sort/filter on the header row.
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({
    s: { r: 0, c: range.s.c },
    e: { r: range.e.r, c: range.e.c },
  })};
}

// ══════════════════════════════════════════════════════
// Main entry point
// ══════════════════════════════════════════════════════

export async function exportToExcel() {
  if (!state.vehicleId) throw new Error('Load a vehicle before exporting');

  // ~750KB; load only when the user actually exports.
  // xlsx-js-style is CommonJS — dynamic import wraps it, so the
  // namespace (book_new, aoa_to_sheet, etc.) lives on .default, not the
  // module root.
  const xlsxMod = await import('https://esm.sh/xlsx-js-style@1.2.0');
  const XLSX = xlsxMod.default || xlsxMod;

  const [allEntries, allFuel, allDocs] = await Promise.all([
    loadEntries(state.vehicleId),
    loadFuelLogs(state.vehicleId),
    loadDocuments(state.vehicleId).catch(() => []),
  ]);

  const mods    = allEntries.filter(e => e.type === 'mod').sort((a, b) => b.date.localeCompare(a.date));
  const service = allEntries.filter(e => e.type === 'service' || e.type === 'repair').sort((a, b) => b.date.localeCompare(a.date));
  const fuel    = [...allFuel].sort((a, b) => b.date.localeCompare(a.date));
  const docs    = [...allDocs].sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });

  const modsSpend    = mods.reduce((s, e) => s + (Number(e.cost) || 0), 0);
  const serviceSpend = service.reduce((s, e) => s + (Number(e.cost) || 0), 0);
  const fuelSpend    = fuel.reduce((s, f) => s + (Number(f.totalCost) || 0), 0);

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Overview ──────────────────────────────────────────
  // Two-column label/value layout. Section headers are visually
  // distinct amber bars; field labels are bold.
  const car = state.car;
  const overviewRows = [
    [{ v: 'Vehicle Export', s: { font: { bold: true, sz: 16, color: { rgb: 'FF7E00' } } } }, ''],
    [{ v: 'Exported', s: STYLE_LABEL }, new Date().toLocaleString('en-AU')],
    ['', ''],
    [{ v: 'Vehicle Details', s: STYLE_SECTION }, ''],
    [{ v: 'Nickname', s: STYLE_LABEL }, car.nickname || ''],
    [{ v: 'Make',     s: STYLE_LABEL }, car.make || ''],
    [{ v: 'Model',    s: STYLE_LABEL }, car.model || ''],
    [{ v: 'Year',     s: STYLE_LABEL }, car.year || ''],
    [{ v: 'Body',     s: STYLE_LABEL }, car.body || ''],
    [{ v: 'Engine',   s: STYLE_LABEL }, car.engine || ''],
    [{ v: 'Variant',  s: STYLE_LABEL }, car.variant || ''],
    [{ v: 'Colour',   s: STYLE_LABEL }, car.colour || ''],
    [{ v: 'Odometer', s: STYLE_LABEL }, car.odo ? `${car.odo} ${car.odoUnit}` : ''],
    [{ v: 'Status',   s: STYLE_LABEL }, car.status || ''],
    [{ v: 'Sold Date',  s: STYLE_LABEL }, car.soldDate ? dateCell(car.soldDate) : ''],
    [{ v: 'Sold Price', s: STYLE_LABEL }, car.soldPrice ? money(car.soldPrice) : ''],
    ['', ''],
    [{ v: 'Summary', s: STYLE_SECTION }, ''],
    [{ v: 'Mods logged',          s: STYLE_LABEL }, mods.length],
    [{ v: 'Service/repairs',      s: STYLE_LABEL }, service.length],
    [{ v: 'Fuel entries',         s: STYLE_LABEL }, fuel.length],
    [{ v: 'Documents',            s: STYLE_LABEL }, docs.length],
    ['', ''],
    [{ v: 'Spend', s: STYLE_SECTION }, ''],
    [{ v: 'Mods',            s: STYLE_LABEL }, money(modsSpend)],
    [{ v: 'Service/repairs', s: STYLE_LABEL }, money(serviceSpend)],
    [{ v: 'Fuel',            s: STYLE_LABEL }, money(fuelSpend)],
    [{ v: 'Total',           s: { ...STYLE_LABEL, ...STYLE_TOTAL } },
     { ...money(modsSpend + serviceSpend + fuelSpend), s: STYLE_TOTAL }],
  ];
  const overviewWs = XLSX.utils.aoa_to_sheet(overviewRows);
  overviewWs['!cols'] = [{ wch: 24 }, { wch: 32 }];
  overviewWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');

  // ── Sheet 2: Mods ──────────────────────────────────────────────
  const modsHeader = ['Date', 'Title', 'Category', 'Cost (AUD)', 'Notes'];
  const modsBody   = mods.map(m => [dateCell(m.date), m.title, m.category || '', money(m.cost), m.notes]);
  const modsWs = XLSX.utils.aoa_to_sheet(
    mods.length
      ? [modsHeader, ...modsBody, ['', '', 'Total', { t: 'n', f: `SUM(D2:D${modsBody.length + 1})`, z: '"$"#,##0.00' }, '']]
      : [modsHeader, ['No mods logged', '', '', '', '']]
  );
  modsWs['!cols'] = [{ wch: 12 }, { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 50 }];
  styleTabularSheet(XLSX, modsWs, { totalRow: mods.length ? modsBody.length + 1 : null });
  XLSX.utils.book_append_sheet(wb, modsWs, 'Mods');

  // ── Sheet 3: Service (includes repairs) ────────────────────────
  const svcHeader = ['Date', 'Type', 'Title', 'Cost (AUD)', 'Notes'];
  const svcBody   = service.map(s => [
    dateCell(s.date), s.type === 'repair' ? 'Repair' : 'Service', s.title, money(s.cost), s.notes,
  ]);
  const svcWs = XLSX.utils.aoa_to_sheet(
    service.length
      ? [svcHeader, ...svcBody, ['', '', 'Total', { t: 'n', f: `SUM(D2:D${svcBody.length + 1})`, z: '"$"#,##0.00' }, '']]
      : [svcHeader, ['No service/repair entries', '', '', '', '']]
  );
  svcWs['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 32 }, { wch: 14 }, { wch: 50 }];
  styleTabularSheet(XLSX, svcWs, { totalRow: service.length ? svcBody.length + 1 : null });
  XLSX.utils.book_append_sheet(wb, svcWs, 'Service');

  // ── Sheet 4: Fuel ──────────────────────────────────────────────
  const fuelHeader = ['Date', 'Odometer (km)', 'Litres', 'Cost (AUD)', 'Station', 'Full Tank', 'Notes'];
  const fuelBody   = fuel.map(f => [
    dateCell(f.date), num(f.odometer, '#,##0'), num(f.litres, '0.00'),
    money(f.totalCost), f.station || '', f.isFullTank ? 'Yes' : 'No', f.notes,
  ]);
  const fuelWs = XLSX.utils.aoa_to_sheet(
    fuel.length
      ? [fuelHeader, ...fuelBody, ['', '', 'Total', { t: 'n', f: `SUM(D2:D${fuelBody.length + 1})`, z: '"$"#,##0.00' }, '', '', '']]
      : [fuelHeader, ['No fuel logs', '', '', '', '', '', '']]
  );
  fuelWs['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 11 }, { wch: 40 }];
  styleTabularSheet(XLSX, fuelWs, { totalRow: fuel.length ? fuelBody.length + 1 : null });
  XLSX.utils.book_append_sheet(wb, fuelWs, 'Fuel');

  // ── Sheet 5: Documents ─────────────────────────────────────────
  const docsHeader = ['Type', 'Title', 'Expiry Date', 'File Size (MB)', 'Notes'];
  const docsBody   = docs.map(d => [
    d.type, d.title, d.expiryDate ? dateCell(d.expiryDate) : '',
    num(d.fileSizeBytes / (1024 * 1024), '0.00'), d.notes,
  ]);
  const docsWs = XLSX.utils.aoa_to_sheet(
    docs.length ? [docsHeader, ...docsBody] : [docsHeader, ['No documents', '', '', '', '']]
  );
  docsWs['!cols'] = [{ wch: 16 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 50 }];
  styleTabularSheet(XLSX, docsWs);
  XLSX.utils.book_append_sheet(wb, docsWs, 'Documents');

  // Filename: slug of nickname (or make-model), then date.
  const slug = (car.nickname || [car.make, car.model].filter(Boolean).join('-') || 'vehicle')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vehicle';
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `car-tracker-${slug}-${date}.xlsx`);
}
