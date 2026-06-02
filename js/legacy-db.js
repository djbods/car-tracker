// Legacy IndexedDB — photo now lives in Supabase Storage; this module is
// kept only to migrate existing local photos to Storage on next sign-in.
// Once every install has migrated, the whole file can go.

import { state, DB_NAME, DB_VER } from './state.js';

export function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('kv'))
        d.createObjectStore('kv');
    };
    req.onsuccess = e => { state.db = e.target.result; res(state.db); };
    req.onerror   = e => rej(e.target.error);
  });
}

export function dbPut(store, value, key) {
  return new Promise((res, rej) => {
    const tx  = state.db.transaction(store, 'readwrite');
    const req = key !== undefined
      ? tx.objectStore(store).put(value, key)
      : tx.objectStore(store).put(value);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}

export function dbGet(store, key) {
  return new Promise((res, rej) => {
    const tx  = state.db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror   = e => rej(e.target.error);
  });
}

export function dbDel(store, key) {
  return new Promise((res, rej) => {
    const tx  = state.db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}
