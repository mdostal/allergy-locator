/**
 * Historical panel tracking (v2, slice 4): explicit user direction --
 * "it should create a graph of the person's allergies over time that they
 * can see when they upload multiple of their own charts." Every time an
 * uploaded panel (CSV or photo/PDF) is applied to the profile, a timestamped
 * snapshot of that panel's sensitivities is kept in the browser's own
 * localStorage -- client-only, no backend, consistent with every other
 * storage decision in this app. Manually adjusting sliders does NOT create a
 * history entry; this tracks upload events specifically, per the user's own
 * framing ("when they upload multiple of their own charts").
 */
export interface PanelSnapshot {
  /** ISO 8601 timestamp of when this panel was applied. */
  date: string;
  sensitivities: Record<string, number>;
}

const STORAGE_KEY = "allergy-locator:panel-history";

export function getPanelHistory(): PanelSnapshot[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // corrupted/foreign data -- fail open to an empty history, never throw
  }
}

export function addPanelSnapshot(sensitivities: Record<string, number>): void {
  const history = getPanelHistory();
  history.push({ date: new Date().toISOString(), sensitivities });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearPanelHistory(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
