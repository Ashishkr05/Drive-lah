const KEY = "listingDraft";

export function loadDraft(): any | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed reading draft", e);
    return null;
  }
}

export function saveDraft(partial: any) {
  try {
    const existing = loadDraft() || { version: 1 };
    const merged = { ...existing, ...partial, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed saving draft", e);
  }
}
