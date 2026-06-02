// Glovebox tab: open the upload modal, file-size hint, save, preview,
// delete. List rendering + storage meter live in render.js (they're
// part of the screen render); this module owns the modal lifecycle.

import {
  state, PER_FILE_LIMIT_BYTES,
  showToast, close, formatBytes, expiryStatus,
} from './state.js';
import {
  addDocument, deleteDocument, getDocumentUrl,
  DOCUMENT_STORAGE_LIMIT_BYTES,
} from '../data.js';
import { renderDocumentsScreen } from './render.js';
import { openCarModal } from './vehicle.js';

const docModal        = document.getElementById('document-modal');
const docPreviewModal = document.getElementById('doc-preview-modal');

// ══════════════════════════════════════════════════════
// Upload modal
// ══════════════════════════════════════════════════════

export function openDocumentModal() {
  if (!state.vehicleId) { openCarModal('add'); return; }
  document.getElementById('doc-input-type').value   = '';
  document.getElementById('doc-input-title').value  = '';
  document.getElementById('doc-input-file').value   = '';
  document.getElementById('doc-input-expiry').value = '';
  document.getElementById('doc-input-notes').value  = '';
  const hint = document.getElementById('doc-file-hint');
  hint.style.display = 'none';
  hint.textContent = '';
  docModal.classList.add('open');
  setTimeout(() => document.getElementById('doc-input-type').focus(), 350);
}

// ══════════════════════════════════════════════════════
// Preview modal
// ══════════════════════════════════════════════════════

export async function openDocumentPreview(id) {
  const doc = state.documents.find(d => d.id === id);
  if (!doc) return;
  state.previewDocId = doc.id;
  document.getElementById('doc-preview-title').textContent = doc.title;
  const meta = [doc.type, formatBytes(doc.fileSizeBytes)];
  const exp = expiryStatus(doc.expiryDate);
  if (exp.label) meta.push(exp.label);
  if (doc.notes) meta.push(doc.notes);
  document.getElementById('doc-preview-meta').textContent = meta.join(' · ');
  const frame = document.getElementById('doc-preview-frame');
  const dl    = document.getElementById('doc-preview-download');
  frame.innerHTML = '<div class="doc-preview-fallback">Loading…</div>';
  dl.removeAttribute('href');

  try {
    const url = await getDocumentUrl(doc.filePath);
    dl.href = url;
    dl.setAttribute('download', doc.title);
    const mime = (doc.mimeType || '').toLowerCase();
    if (mime.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = doc.title;
      frame.replaceChildren(img);
    } else if (mime === 'application/pdf') {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.title = doc.title;
      frame.replaceChildren(iframe);
    } else {
      frame.innerHTML = '<div class="doc-preview-fallback">No inline preview — use Download to open.</div>';
    }
  } catch (err) {
    frame.innerHTML = `<div class="doc-preview-fallback">Preview failed: ${err?.message || 'unknown error'}</div>`;
  }
  docPreviewModal.classList.add('open');
}

// ══════════════════════════════════════════════════════
// Top-level wiring — called once by main.js
// ══════════════════════════════════════════════════════

export function wireDocumentHandlers() {
  // Show file size + warn early if the chosen file would push the user
  // over the per-file or total cap — saves them filling out the rest
  // of the form.
  document.getElementById('doc-input-file').addEventListener('change', e => {
    const file = e.target.files[0];
    const hint = document.getElementById('doc-file-hint');
    if (!file) { hint.style.display = 'none'; hint.textContent = ''; return; }
    const remaining = DOCUMENT_STORAGE_LIMIT_BYTES - state.userStorageBytes;
    let msg = `${formatBytes(file.size)} · ${formatBytes(remaining)} remaining of your ${formatBytes(DOCUMENT_STORAGE_LIMIT_BYTES)} limit`;
    if (file.size > PER_FILE_LIMIT_BYTES) {
      msg = `File is ${formatBytes(file.size)} — max ${formatBytes(PER_FILE_LIMIT_BYTES)} per upload.`;
    } else if (file.size > remaining) {
      msg = `This file would push you ${formatBytes(file.size - remaining)} over your storage limit.`;
    }
    hint.textContent = msg;
    hint.style.display = '';
  });

  document.getElementById('save-doc-btn').onclick = async () => {
    const type    = document.getElementById('doc-input-type').value;
    const title   = document.getElementById('doc-input-title').value.trim();
    const fileEl  = document.getElementById('doc-input-file');
    const expiry  = document.getElementById('doc-input-expiry').value;
    const notes   = document.getElementById('doc-input-notes').value.trim();
    const file    = fileEl.files[0];

    if (!type)  { showToast('Pick a document type'); return; }
    if (!file)  { showToast('Choose a file to upload'); return; }
    if (file.size > PER_FILE_LIMIT_BYTES) {
      showToast(`File too large — max ${formatBytes(PER_FILE_LIMIT_BYTES)} per upload`);
      return;
    }
    if (state.userStorageBytes + file.size > DOCUMENT_STORAGE_LIMIT_BYTES) {
      showToast(`Storage full — ${formatBytes(DOCUMENT_STORAGE_LIMIT_BYTES - state.userStorageBytes)} remaining`);
      return;
    }

    const saveBtn = document.getElementById('save-doc-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Uploading…';
    try {
      const saved = await addDocument(state.vehicleId, { type, title, expiryDate: expiry, notes }, file);
      state.documents.unshift(saved);
      state.userStorageBytes += saved.fileSizeBytes || 0;
      close(docModal);
      renderDocumentsScreen();
      showToast('Document saved ✓');
    } catch (err) {
      showToast('Upload failed: ' + (err?.message || 'unknown error'));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Document';
    }
  };

  document.getElementById('doc-delete-btn').onclick = async () => {
    const doc = state.documents.find(d => d.id === state.previewDocId);
    if (!doc) return;
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(doc);
      state.documents = state.documents.filter(d => d.id !== doc.id);
      state.userStorageBytes = Math.max(0, state.userStorageBytes - (doc.fileSizeBytes || 0));
      state.previewDocId = null;
      close(docPreviewModal);
      renderDocumentsScreen();
      showToast('Document deleted');
    } catch (err) {
      showToast('Delete failed: ' + (err?.message || 'unknown error'));
    }
  };
}
