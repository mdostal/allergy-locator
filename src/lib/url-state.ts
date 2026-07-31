import { ALLERGENS } from "@/lib/allergens/registry";

export type Mode = "overlay" | "composite";

export interface UrlState {
  mode: Mode;
  active: Set<string>;
  sensitivities: Record<string, number>;
  month: number | null;
}

export const URL_STATE_PARAM = "s";
const VERSION = 1;

const DEFAULT_STATE: UrlState = { mode: "overlay", active: new Set(), sensitivities: {}, month: null };

// Allergen ids map to their fixed position in the registry (story s3/s4's
// data-driven order) rather than being spelled out per-allergen in the URL --
// the encoding stays compact (a handful of bytes) no matter how many
// allergens the data file grows to.
const idToIndex = new Map(ALLERGENS.map((a, i) => [a.id, i]));
const indexToId = new Map(ALLERGENS.map((a, i) => [i, a.id]));

function toBase64Url(bytes: number[]): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): number[] {
  const restored = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = restored + "=".repeat((4 - (restored.length % 4)) % 4);
  const binary = atob(padded);
  return Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Byte layout: [version, mode(0|1), month(0=annual|1-12), count, ...entries]
 * Overlay mode: each entry is 1 byte (allergen index).
 * Composite mode: each entry is 2 bytes (allergen index, sensitivity 0-100).
 * Both fit in a single byte since neither the registry size nor a percentage
 * needs more than 8 bits -- this is what keeps the encoding compact as the
 * allergen count grows, instead of one query param per allergen.
 */
export function encodeState(state: UrlState): string {
  const bytes: number[] = [VERSION, state.mode === "overlay" ? 0 : 1, state.month ?? 0];

  if (state.mode === "overlay") {
    const indices = Array.from(state.active)
      .map((id) => idToIndex.get(id))
      .filter((i): i is number => i !== undefined);
    bytes.push(indices.length, ...indices);
  } else {
    const entries = Object.entries(state.sensitivities).filter(([, v]) => v > 0);
    bytes.push(entries.length);
    for (const [id, value] of entries) {
      const index = idToIndex.get(id);
      if (index === undefined) continue;
      bytes.push(index, Math.max(0, Math.min(100, Math.round(value))));
    }
  }

  return toBase64Url(bytes);
}

/** Never throws -- a missing, truncated, or corrupted param falls back to
 * defaults (or to as much of the state as could be recovered) rather than
 * crashing the app. */
export function decodeState(encoded: string | null | undefined): UrlState {
  if (!encoded) return DEFAULT_STATE;

  try {
    const bytes = fromBase64Url(encoded);
    let i = 0;

    if (bytes[i++] !== VERSION) return DEFAULT_STATE;

    const mode: Mode = bytes[i++] === 1 ? "composite" : "overlay";
    const monthByte = bytes[i++];
    const month = monthByte >= 1 && monthByte <= 12 ? monthByte : null;
    const count = bytes[i++] ?? 0;

    const active = new Set<string>();
    const sensitivities: Record<string, number> = {};

    if (mode === "overlay") {
      for (let n = 0; n < count; n++) {
        const id = indexToId.get(bytes[i++]);
        if (id) active.add(id);
      }
    } else {
      for (let n = 0; n < count; n++) {
        const id = indexToId.get(bytes[i++]);
        const value = bytes[i++];
        if (id !== undefined && value !== undefined) sensitivities[id] = value;
      }
    }

    return { mode, active, sensitivities, month };
  } catch {
    return DEFAULT_STATE;
  }
}

export function buildQueryString(state: UrlState): string {
  const params = new URLSearchParams();
  params.set(URL_STATE_PARAM, encodeState(state));
  return `?${params.toString()}`;
}
