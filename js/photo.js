// Vehicle photo: load (Supabase Storage with legacy IndexedDB fallback),
// apply to the dashboard card, reset on vehicle switch, and handle the
// upload+resize when the user picks a file.

import { state, showToast } from './state.js';
import { dbGet, dbDel } from './legacy-db.js';
import {
  uploadVehiclePhoto,
  getVehiclePhotoUrl,
} from '../data.js';

const photoInput     = document.getElementById('photo-input');
const carPhoto       = document.getElementById('car-photo');
const carPhotoBg     = document.getElementById('car-photo-bg');
const uploadPrompt   = document.getElementById('upload-prompt');
const changePhotoBtn = document.getElementById('change-photo-btn');

// Preferred source: the vehicle row's photo_path → signed URL from
// Storage. Fallback: a photo still living in IndexedDB from before this
// migration — migrate it once, then forget about it.
export async function loadSavedPhoto() {
  if (state.car.photoPath) {
    try {
      const url = await getVehiclePhotoUrl(state.car.photoPath);
      if (url) { applyPhoto(url); return; }
    } catch (err) {
      console.error('Photo load failed:', err);
      showToast('Photo failed to load');
    }
  }

  const legacy = await dbGet('kv', 'photo');
  if (!legacy || !state.vehicleId) return;

  applyPhoto(legacy);
  try {
    const blob = await (await fetch(legacy)).blob();
    const path = await uploadVehiclePhoto(state.vehicleId, blob);
    state.car.photoPath = path;
    await dbDel('kv', 'photo');
    showToast('Photo synced to your account ✓');
  } catch (err) {
    console.error('Photo migration failed — will retry next sign-in:', err);
  }
}

export function applyPhoto(src) {
  carPhoto.src = src;
  carPhoto.classList.add('loaded');
  // Same image, blurred + enlarged, fills the letterbox behind the contained
  // foreground so any aspect ratio reads as intentional (see #car-photo-bg).
  carPhotoBg.src = src;
  carPhotoBg.classList.add('loaded');
  uploadPrompt.classList.add('hidden');
  changePhotoBtn.style.display = 'flex';
}

// Clear the on-screen photo back to the empty-state prompt. Used when
// switching vehicles, before the new vehicle's photo (if any) loads in.
export function resetPhoto() {
  carPhoto.removeAttribute('src');
  carPhoto.classList.remove('loaded');
  carPhotoBg.removeAttribute('src');
  carPhotoBg.classList.remove('loaded');
  uploadPrompt.classList.remove('hidden');
  changePhotoBtn.style.display = 'none';
}

// Wire up the photo upload pipeline. Called from main.js after the
// car-modal opener (openCarModal) is imported, so the empty-state click
// can fall back to opening the Add Vehicle modal.
export function wirePhotoHandlers({ openCarModal }) {
  document.getElementById('car-image-wrap').addEventListener('click', e => {
    if (e.target.closest('.car-edit-btn') || e.target.closest('.car-photo-btn')) return;
    // No vehicle yet → the photo tap doubles as the Add Vehicle prompt.
    if (!state.vehicleId) { openCarModal('add'); return; }
    if (!carPhoto.classList.contains('loaded')) photoInput.click();
  });
  changePhotoBtn.addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!state.vehicleId) { showToast('Vehicle not loaded yet'); photoInput.value = ''; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Larger cap than the old 900×500: the photo now renders "contained"
        // (whole image visible) rather than cropped, so portrait and wide
        // shots need real resolution to stay sharp on the desktop-width card.
        const maxW = 1600, maxH = 1200;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(async blob => {
          if (!blob) { showToast('Photo processing failed'); return; }
          try {
            const path = await uploadVehiclePhoto(state.vehicleId, blob);
            state.car.photoPath = path;
            const url = await getVehiclePhotoUrl(path);
            applyPhoto(url);
            showToast('Photo saved ✓');
          } catch (err) {
            showToast('Save failed: ' + (err?.message || 'unknown error'));
          }
        }, 'image/jpeg', 0.82);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
  });
}
