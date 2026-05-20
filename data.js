// Supabase-backed data access for the E39 Garage Tracker.
// Replaces the IndexedDB layer. RLS in supabase/schema.sql scopes every
// query to auth.uid() — these functions assume an authenticated session.
import { supabase } from './supabase-client.js';

// ──────────────────────────────────────────────────────────────────
// Vehicles
// ──────────────────────────────────────────────────────────────────

// Map a vehicles row → the UI's `car` object shape used throughout index.html.
export function rowToCar(row) {
  if (!row) return null;
  return {
    id:       row.id,
    nickname: row.nickname || '',
    year:     row.year ? String(row.year) : '',
    model:    row.model    || '530i',
    body:     row.body     || 'Sedan',
    engine:   row.engine   || 'M54',
    colour:   row.colour   || '',
    odo:      row.odometer ? String(row.odometer) : '',
    odoUnit:  row.odometer_unit || 'km',
  };
}

// Returns the user's first vehicle row, or null if they have none yet.
// Single-vehicle assumption holds until §1.6 (My Garage view).
export async function loadCurrentVehicle() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Insert if no id, otherwise update. Returns the saved row.
export async function upsertVehicle(vehicle) {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');

  // nickname/make/model are NOT NULL in the schema — fall back to sensible
  // defaults so a brand-new user with an empty nickname can still be saved.
  const nickname = (vehicle.nickname || '').trim()
    || [vehicle.model, vehicle.body].filter(Boolean).join(' ').trim()
    || 'My E39';

  const row = {
    user_id:       user.id,
    nickname,
    make:          (vehicle.make  || '').trim() || 'BMW',
    model:         (vehicle.model || '').trim() || '530i',
    year:          vehicle.year ? parseInt(vehicle.year, 10) : null,
    body:          vehicle.body     || null,
    engine:        vehicle.engine   || null,
    colour:        vehicle.colour   || null,
    odometer:      vehicle.odo ? parseInt(vehicle.odo, 10) : null,
    odometer_unit: vehicle.odoUnit  || 'km',
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
    id:    r.id,
    type:  'mod',
    title: r.title,
    cost:  Number(r.cost) || 0,
    date:  r.date,
    notes: r.description || '',
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
