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
  const [m, s] = await Promise.all([
    supabase.from('mod_logs').delete().eq('vehicle_id', vehicleId),
    supabase.from('service_logs').delete().eq('vehicle_id', vehicleId),
  ]);
  if (m.error) throw m.error;
  if (s.error) throw s.error;
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
