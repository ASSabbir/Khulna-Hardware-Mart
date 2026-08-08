// FILE: src/utils/draftStorage.js (NEW) — shared draft storage between Invoice.jsx & DraftInvoice.jsx

const AUTOSAVE_KEY = "khm_invoice_draft_v1";
const DRAFTS_KEY = "khm_drafts_multi_v1";

export const loadDraft = () => {
  try { const raw = localStorage.getItem(AUTOSAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
};
export const saveDraft = (data) => { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data)); } catch {} };
export const clearDraft = () => { try { localStorage.removeItem(AUTOSAVE_KEY); } catch {} };

export const loadAllDrafts = () => {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || "[]"); } catch { return []; }
};
export const saveAllDrafts = (list) => { try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); } catch {} };
export const deleteDraftById = (id) => saveAllDrafts(loadAllDrafts().filter((d) => d.id !== id));
export const upsertDraft = (payload) => {
  const drafts = loadAllDrafts();
  const idx = drafts.findIndex((d) => d.id === payload.id);
  if (idx >= 0) drafts[idx] = payload; else drafts.unshift(payload);
  saveAllDrafts(drafts);
  return drafts;
};