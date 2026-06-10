// Supabase-backed data access for the Car Tracker app.
// Replaces the IndexedDB layer. RLS in supabase/schema.sql scopes every
// query to auth.uid() — these functions assume an authenticated session.
import { supabase } from './supabase-client.js';

// ──────────────────────────────────────────────────────────────────
// Vehicles
// ──────────────────────────────────────────────────────────────────

// Map a vehicles row → the UI's `car` object shape used throughout index.html.
// `variant` carries the trim/spec text for non-BMW makes; for BMW we store
// engine code in `engine` and body style in `body` as before.
export function rowToCar(row) {
  if (!row) return null;
  return {
    id:                       row.id,
    nickname:                 row.nickname || '',
    year:                     row.year ? String(row.year) : '',
    make:                     row.make     || '',
    model:                    row.model    || '',
    body:                     row.body     || '',
    engine:                   row.engine   || '',
    variant:                  row.variant  || '',
    colour:                   row.colour   || '',
    odo:                      row.odometer ? String(row.odometer) : '',
    odoUnit:                  row.odometer_unit || 'km',
    fuelType:                 row.fuel_type    || '',
    drivetrain:               row.drivetrain   || '',
    transmission:             row.transmission || '',
    photoPath:                row.photo_path || null,
    status:                   row.status || 'active',
    soldDate:                 row.sold_date || '',
    soldPrice:                row.sold_price != null ? String(row.sold_price) : '',
    combinedCycleConsumption: row.combined_cycle_consumption != null
      ? String(row.combined_cycle_consumption)
      : '',
  };
}

// All of the signed-in user's vehicles, oldest first. RLS keeps each
// user pinned to their own rows.
export async function loadVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Insert if no id, otherwise update. Returns the saved row.
export async function upsertVehicle(vehicle) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');

  const make  = (vehicle.make  || '').trim();
  const model = (vehicle.model || '').trim();
  if (!make || !model) throw new Error('Make and model are required');

  // nickname is NOT NULL in the schema — derive a default from make/model so
  // the user can leave it blank without the insert failing.
  const nickname = (vehicle.nickname || '').trim()
    || [model, vehicle.body].filter(Boolean).join(' ').trim()
    || `My ${make}`;

  // Status drives whether sold_date / sold_price are persisted. When the user
  // flips back to 'active' we wipe both fields so stale handover data doesn't
  // resurface if they ever re-mark the car as sold.
  const status = vehicle.status === 'sold' || vehicle.status === 'archived'
    ? vehicle.status
    : 'active';
  const soldPrice = parseFloat(vehicle.soldPrice);
  const ccConsumption = parseFloat(vehicle.combinedCycleConsumption);

  const row = {
    user_id:                     user.id,
    nickname,
    make,
    model,
    year:                        vehicle.year ? parseInt(vehicle.year, 10) : null,
    variant:                     (vehicle.variant || '').trim() || null,
    body:                        vehicle.body     || null,
    engine:                      vehicle.engine   || null,
    colour:                      vehicle.colour   || null,
    odometer:                    vehicle.odo ? parseInt(vehicle.odo, 10) : null,
    odometer_unit:               vehicle.odoUnit  || 'km',
    fuel_type:                   (vehicle.fuelType    || '').trim() || null,
    drivetrain:                  (vehicle.drivetrain  || '').trim() || null,
    transmission:                (vehicle.transmission || '').trim() || null,
    status,
    sold_date:                   status === 'sold' && vehicle.soldDate ? vehicle.soldDate : null,
    sold_price:                  status === 'sold' && Number.isFinite(soldPrice) ? soldPrice : null,
    combined_cycle_consumption:  Number.isFinite(ccConsumption) ? ccConsumption : null,
  };

  if (vehicle.id) {
    const { data, error } = await supabase
      .from('vehicles').update(row).eq('id', vehicle.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('vehicles').insert(row).select().single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────────────────────────
// Garage name (per-user setting, stored on auth.users.user_metadata)
// ──────────────────────────────────────────────────────────────────
//
// We avoid a `profiles` table for this single string — Supabase Auth's
// user_metadata is read on every getSession() so it's already available
// during boot without an extra query.

export const DEFAULT_GARAGE_NAME = 'Car Tracker';

export async function getGarageName() {
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.garage_name || '').trim();
  return name || DEFAULT_GARAGE_NAME;
}

export async function setGarageName(name) {
  const trimmed = (name || '').trim();
  const { error } = await supabase.auth.updateUser({
    data: { garage_name: trimmed || null },
  });
  if (error) throw error;
  return trimmed || DEFAULT_GARAGE_NAME;
}

// ──────────────────────────────────────────────────────────────────
// Entries (mod_logs + service_logs merged into one in-memory list)
// ──────────────────────────────────────────────────────────────────
//
// In-memory shape (matches the existing UI):
//   { id, type: 'mod'|'service'|'repair', title, cost, date, notes }
//
// type → table:
//   'mod'                   → mod_logs
//   'service' | 'repair'    → service_logs (with kind column)

function modRowToEntry(r) {
  return {
    id:       r.id,
    type:     'mod',
    title:    r.title,
    cost:     Number(r.cost) || 0,
    date:     r.date,
    notes:    r.description || '',
    category: r.category || null,
  };
}
function serviceRowToEntry(r) {
  return {
    id:    r.id,
    type:  r.kind === 'repair' ? 'repair' : 'service',
    title: r.title,
    cost:  Number(r.cost) || 0,
    date:  r.date,
    notes: r.description || '',
  };
}

export async function loadEntries(vehicleId) {
  if (!vehicleId) return [];
  const [mods, services] = await Promise.all([
    supabase.from('mod_logs').select('*').eq('vehicle_id', vehicleId),
    supabase.from('service_logs').select('*').eq('vehicle_id', vehicleId),
  ]);
  if (mods.error) throw mods.error;
  if (services.error) throw services.error;
  const entries = [
    ...mods.data.map(modRowToEntry),
    ...services.data.map(serviceRowToEntry),
  ];
  // Newest first by date, then created_at — date is the user-facing sort key.
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return entries;
}

export async function addEntry(vehicleId, entry) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');

  if (entry.type === 'mod') {
    const { data, error } = await supabase.from('mod_logs').insert({
      vehicle_id:  vehicleId,
      user_id:     user.id,
      date:        entry.date,
      title:       entry.title,
      description: entry.notes || null,
      cost:        entry.cost || 0,
      category:    entry.category || null,
    }).select().single();
    if (error) throw error;
    return modRowToEntry(data);
  }

  const { data, error } = await supabase.from('service_logs').insert({
    vehicle_id:  vehicleId,
    user_id:     user.id,
    date:        entry.date,
    title:       entry.title,
    description: entry.notes || null,
    cost:        entry.cost || 0,
    kind:        entry.type === 'repair' ? 'repair' : 'service',
  }).select().single();
  if (error) throw error;
  return serviceRowToEntry(data);
}

// Returns every {title, category} pair from the current user's mods across
// all vehicles. Used to power the brand-autocomplete datalist on the entry
// modal. RLS scopes the rows to the signed-in user, so no manual user_id
// filter is needed.
export async function loadModTitleSuggestions() {
  const { data, error } = await supabase
    .from('mod_logs')
    .select('title, category');
  if (error) throw error;
  return (data || [])
    .filter(r => r.title)
    .map(r => ({ title: r.title, category: r.category || null }));
}

export async function deleteEntry(entry) {
  const table = entry.type === 'mod' ? 'mod_logs' : 'service_logs';
  const { error } = await supabase.from(table).delete().eq('id', entry.id);
  if (error) throw error;
}

export async function clearAllEntries(vehicleId) {
  if (!vehicleId) return;
  const [m, s, f] = await Promise.all([
    supabase.from('mod_logs').delete().eq('vehicle_id', vehicleId),
    supabase.from('service_logs').delete().eq('vehicle_id', vehicleId),
    supabase.from('fuel_logs').delete().eq('vehicle_id', vehicleId),
  ]);
  if (m.error) throw m.error;
  if (s.error) throw s.error;
  if (f.error) throw f.error;
}

// ──────────────────────────────────────────────────────────────────
// Fuel logs
// ──────────────────────────────────────────────────────────────────
//
// Stored shape mirrors the table; the UI never touches snake_case so we
// normalise on read. is_full_tank flags whether the entry closes a tank
// cycle — partial fills count toward spend but are skipped as boundaries
// in the L/100km calc.

function fuelRowToEntry(r) {
  return {
    id:          r.id,
    date:        r.date,
    odometer:    r.odometer,
    litres:      Number(r.litres) || 0,
    totalCost:   r.total_cost != null ? Number(r.total_cost) : 0,
    station:     r.station || '',
    isFullTank:  r.is_full_tank !== false,
    notes:       r.notes || '',
  };
}

export async function loadFuelLogs(vehicleId) {
  if (!vehicleId) return [];
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(fuelRowToEntry);
}

export async function addFuelLog(vehicleId, fuel) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');
  if (!vehicleId) throw new Error('No vehicle selected');

  const { data, error } = await supabase.from('fuel_logs').insert({
    vehicle_id:   vehicleId,
    user_id:      user.id,
    date:         fuel.date,
    odometer:     fuel.odometer,
    litres:       fuel.litres,
    total_cost:   Number.isFinite(fuel.totalCost) ? fuel.totalCost : null,
    station:      fuel.station || null,
    is_full_tank: fuel.isFullTank !== false,
    notes:        fuel.notes || null,
  }).select().single();
  if (error) throw error;
  return fuelRowToEntry(data);
}

export async function deleteFuelLog(id) {
  const { error } = await supabase.from('fuel_logs').delete().eq('id', id);
  if (error) throw error;
}

// Walk fuel entries in odometer order and compute L/100km between each pair
// of consecutive full-tank entries. The standard "tank-to-tank" method:
// litres burnt over a distance = everything pumped AFTER the first full tank
// up to AND INCLUDING the next full tank (partials in between count, since
// that fuel was consumed over the same distance). Entries with missing or
// zero odometer are skipped.
//
// Returns { samples: [{from, to, distance, litres, l100}], rolling: number|null }
// where `rolling` is the mean of the last `windowSize` samples (default 10).
export function computeFuelEconomy(fuelEntries, windowSize = 10) {
  const sorted = [...fuelEntries]
    .filter(f => f.odometer > 0 && f.litres > 0)
    .sort((a, b) => a.odometer - b.odometer);
  const samples = [];
  let lastFullIdx = -1;
  let litresSinceLastFull = 0;
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (lastFullIdx === -1) {
      if (e.isFullTank) lastFullIdx = i;
      continue;
    }
    litresSinceLastFull += e.litres;
    if (e.isFullTank) {
      const prev = sorted[lastFullIdx];
      const distance = e.odometer - prev.odometer;
      if (distance > 0) {
        samples.push({
          from:     prev.date,
          to:       e.date,
          distance,
          litres:   litresSinceLastFull,
          l100:     (litresSinceLastFull / distance) * 100,
        });
      }
      lastFullIdx = i;
      litresSinceLastFull = 0;
    }
  }
  const window = samples.slice(-windowSize);
  const rolling = window.length
    ? window.reduce((s, x) => s + x.l100, 0) / window.length
    : null;
  return { samples, rolling };
}

// ──────────────────────────────────────────────────────────────────
// Vehicle photo (Supabase Storage)
// ──────────────────────────────────────────────────────────────────
//
// Bucket: 'car-photos' (private). RLS pins each user to a folder named
// after their auth.uid(). Path convention: <user_id>/<vehicle_id>.jpg —
// stable so re-uploads overwrite the same object.

const PHOTO_BUCKET = 'car-photos';

export async function uploadVehiclePhoto(vehicleId, blob) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');
  if (!vehicleId) throw new Error('No vehicle to attach photo to');

  const path = `${user.id}/${vehicleId}.jpg`;
  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (upErr) throw upErr;

  const { error: rowErr } = await supabase
    .from('vehicles')
    .update({ photo_path: path })
    .eq('id', vehicleId);
  if (rowErr) throw rowErr;

  return path;
}

// Signed URL good for one hour — enough for a single page session. The
// <img> tag caches the bitmap, so we don't need a long-lived URL.
export async function getVehiclePhotoUrl(photoPath) {
  if (!photoPath) return null;
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photoPath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

// ──────────────────────────────────────────────────────────────────
// Documents (Supabase table + Storage bucket)
// ──────────────────────────────────────────────────────────────────
//
// Bucket: 'documents' (private). Folder-per-user RLS, same pattern as
// car-photos. Path convention: <user_id>/<vehicle_id>/<uuid>.<ext>.
// The metadata (title, type, expiry, etc.) lives in the documents table;
// the file itself in Storage. file_size_bytes is denormalised onto the
// row so the per-user usage check is one cheap query instead of a stat.

const DOCUMENTS_BUCKET = 'documents';

// 50MB total per user during beta. Soft cap enforced client-side — when
// tier flags ship in 2.8 this becomes free=50MB / paid=1GB driven by
// subscription state, ideally validated server-side.
export const DOCUMENT_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024;

export const DOCUMENT_TYPES = [
  'Insurance', 'Registration', 'Roadworthy', 'Warranty',
  'Manual', 'Receipt', 'Other',
];

function documentRowToEntry(r) {
  return {
    id:            r.id,
    vehicleId:     r.vehicle_id,
    type:          r.type,
    title:         r.title,
    filePath:      r.file_path,
    fileSizeBytes: r.file_size_bytes != null ? Number(r.file_size_bytes) : 0,
    mimeType:      r.mime_type || '',
    expiryDate:    r.expiry_date || '',
    notes:         r.notes || '',
    createdAt:     r.created_at,
  };
}

export async function loadDocuments(vehicleId) {
  if (!vehicleId) return [];
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('expiry_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(documentRowToEntry);
}

// Sum bytes across every document the signed-in user owns, scoped by RLS.
// Used to decide whether the next upload would push them over the cap.
export async function getUserStorageUsageBytes() {
  const { data, error } = await supabase
    .from('documents')
    .select('file_size_bytes');
  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + (Number(r.file_size_bytes) || 0), 0);
}

function fileExtension(file) {
  const name = file?.name || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

// Uploads the file then writes the metadata row. Returns the saved entry.
// Caller is responsible for checking storage cap *before* invoking this —
// keeps the UI in charge of showing a friendly cap-exceeded message.
export async function addDocument(vehicleId, doc, file) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');
  if (!vehicleId) throw new Error('No vehicle selected');
  if (!file) throw new Error('No file provided');
  if (!DOCUMENT_TYPES.includes(doc.type)) throw new Error('Invalid document type');

  const ext = fileExtension(file);
  const objectName = `${crypto.randomUUID()}${ext ? '.' + ext : ''}`;
  const path = `${user.id}/${vehicleId}/${objectName}`;

  const { error: upErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (upErr) throw upErr;

  const { data, error } = await supabase.from('documents').insert({
    vehicle_id:      vehicleId,
    user_id:         user.id,
    type:            doc.type,
    title:           (doc.title || '').trim() || file.name,
    file_path:       path,
    file_size_bytes: file.size || null,
    mime_type:       file.type || null,
    expiry_date:     doc.expiryDate || null,
    notes:           (doc.notes || '').trim() || null,
  }).select().single();

  if (error) {
    // Roll back the orphaned Storage object so a row failure doesn't leak bytes.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]).catch(() => {});
    throw error;
  }
  return documentRowToEntry(data);
}

export async function deleteDocument(doc) {
  if (!doc?.id) return;
  // Storage first — if the row delete fails we'd rather have a dangling
  // row pointing at a missing object than a live row pointing at deleted
  // bytes the user thinks are still backed up.
  if (doc.filePath) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.filePath]).catch(() => {});
  }
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  if (error) throw error;
}

// Signed URL good for one hour. Long enough to open / preview / download
// within a session; short enough that a leaked link expires quickly.
export async function getDocumentUrl(filePath) {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
