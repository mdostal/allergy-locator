/**
 * Named, saved sensitivity profiles (v3 kickoff, .pHive/planning/roadmap.md):
 * client-side only via localStorage, no accounts, no backend -- consistent
 * with every other storage decision in this app (byo-key.ts,
 * panel-history.ts). This slice covers saving/naming/loading/deleting a
 * profile only; overlaying two saved profiles on the map at once is a
 * separate, later v3 slice built on top of this list.
 */
export interface SavedProfile {
  id: string;
  name: string;
  sensitivities: Record<string, number>;
  savedAt: string;
}

const STORAGE_KEY = "allergy-locator:saved-profiles";

export function getSavedProfiles(): SavedProfile[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // corrupted/foreign data -- fail open to an empty list, never throw
  }
}

function writeProfiles(profiles: SavedProfile[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function saveProfile(name: string, sensitivities: Record<string, number>): SavedProfile {
  const profile: SavedProfile = { id: crypto.randomUUID(), name, sensitivities, savedAt: new Date().toISOString() };
  writeProfiles([...getSavedProfiles(), profile]);
  return profile;
}

export function deleteProfile(id: string): void {
  writeProfiles(getSavedProfiles().filter((p) => p.id !== id));
}

export function renameProfile(id: string, name: string): void {
  writeProfiles(getSavedProfiles().map((p) => (p.id === id ? { ...p, name } : p)));
}
