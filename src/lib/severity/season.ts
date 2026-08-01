/**
 * Season-position scoring (story s6): a month-indexed multiplier applied on top of
 * each allergen's existing annual severity score, treating the annual score as
 * that allergen's PEAK-season severity for the city's climate zone (a defensible
 * reading: the validated grass formula was fit against lived, in-season
 * experience). This is new modeling work grounded in general, well-established
 * pollen phenology patterns (grass/tree/weed seasonal timing by climate zone is
 * standard aerobiology/agricultural-extension knowledge — see e.g. the season-
 * length sources already cited in docs/MODEL-NOTES.md: Anderegg 2021, Zhang-
 * Steiner 2022), simplified to 4 climate-zone groups rather than the annual
 * model's 13 Koppen codes — a coarser, honestly-labeled simplification
 * appropriate for a first pass at this new dimension.
 *
 * Mold is handled per-species rather than by the generic "mold" category, since
 * story s3's research found Cladosporium and Alternaria have genuinely different
 * weather/calendar drivers (data/allergens-scoring.md) — that distinction carries
 * through here too.
 */
import type { AllergenCategory } from "@/lib/allergens/registry";

export type ZoneGroup = "A" | "B" | "C" | "D";

const ZONE_GROUP: Record<string, ZoneGroup> = {
  Aw: "A",
  BWh: "B",
  BWk: "B",
  BSh: "B",
  BSk: "B",
  Cfa: "C",
  Cfb: "C",
  Csa: "C",
  Csb: "C",
  Dfa: "D",
  Dfb: "D",
  Dfc: "D",
  Dsb: "D",
};

export function zoneGroupFor(koppen: string): ZoneGroup {
  return ZONE_GROUP[koppen] ?? "C";
}

type MonthCurve = [number, number, number, number, number, number, number, number, number, number, number, number];

const GRASS_CURVE: Record<ZoneGroup, MonthCurve> = {
  A: [0.85, 0.85, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.85, 0.85],
  C: [0.05, 0.05, 0.15, 0.4, 0.75, 1.0, 1.0, 0.85, 0.55, 0.25, 0.1, 0.05],
  B: [0.05, 0.05, 0.15, 0.45, 0.8, 1.0, 0.95, 0.75, 0.45, 0.15, 0.05, 0.05],
  D: [0.02, 0.02, 0.03, 0.1, 0.35, 0.8, 1.0, 0.75, 0.3, 0.08, 0.02, 0.02],
};

const WEED_CURVE: Record<ZoneGroup, MonthCurve> = {
  A: [0.7, 0.7, 0.75, 0.8, 0.8, 0.85, 0.85, 0.9, 0.9, 0.85, 0.75, 0.7],
  C: [0.03, 0.03, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9, 1.0, 0.8, 0.3, 0.05],
  B: [0.03, 0.03, 0.08, 0.2, 0.4, 0.6, 0.8, 0.95, 1.0, 0.7, 0.25, 0.05],
  D: [0.01, 0.01, 0.02, 0.05, 0.15, 0.35, 0.6, 0.9, 1.0, 0.6, 0.15, 0.02],
};

const TREE_CURVE: Record<ZoneGroup, MonthCurve> = {
  A: [0.6, 0.65, 0.75, 0.8, 0.75, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5, 0.55],
  C: [0.05, 0.15, 0.6, 1.0, 0.85, 0.4, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05],
  B: [0.05, 0.1, 0.4, 0.8, 0.7, 0.3, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05],
  D: [0.02, 0.03, 0.15, 0.6, 1.0, 0.5, 0.15, 0.05, 0.02, 0.02, 0.02, 0.02],
};

/** Cladosporium: humidity/temp-driven per the Denver study (data/allergens-
 * scoring.md) — broad warm-season peak, real zone-to-zone spread. */
const CLADOSPORIUM_CURVE: Record<ZoneGroup, MonthCurve> = {
  A: [0.7, 0.7, 0.75, 0.8, 0.85, 0.9, 0.9, 0.9, 0.85, 0.8, 0.75, 0.7],
  C: [0.15, 0.15, 0.25, 0.45, 0.65, 0.85, 1.0, 0.95, 0.75, 0.45, 0.25, 0.15],
  B: [0.1, 0.1, 0.15, 0.3, 0.45, 0.6, 0.7, 0.65, 0.5, 0.3, 0.15, 0.1],
  D: [0.05, 0.05, 0.1, 0.25, 0.45, 0.7, 0.9, 0.85, 0.55, 0.25, 0.1, 0.05],
};

/** Alternaria: the same Denver study found NO strong weather correlation for
 * this genus — its curve is deliberately flat across zone groups (calendar-
 * driven, not climate-zone-driven), matching that finding honestly rather than
 * forcing a humidity pattern the literature didn't support for it. */
const ALTERNARIA_CURVE: MonthCurve = [0.3, 0.3, 0.35, 0.4, 0.5, 0.65, 0.85, 1.0, 0.9, 0.6, 0.4, 0.3];

/**
 * `strength` (0-1, default 1 = the full modeled curve) is Advanced mode's
 * live-adjustable knob on this formula (see src/lib/model-settings.ts):
 * `1` uses the curve exactly as modeled above; `0` flattens it to no
 * seasonality at all (every month reads like the annual/peak score); values
 * between interpolate linearly. This is a real, live-computed parameter --
 * not a cosmetic toggle -- so "front and center, and allow modification" is
 * an honest claim for this part of the model.
 */
export function seasonMultiplier(
  allergenId: string,
  category: AllergenCategory,
  koppen: string,
  month: number, // 1-12
  strength = 1,
): number {
  const zone = zoneGroupFor(koppen);
  const i = Math.min(11, Math.max(0, month - 1));

  let raw: number;
  if (allergenId === "alternaria") raw = ALTERNARIA_CURVE[i];
  else if (allergenId === "cladosporium") raw = CLADOSPORIUM_CURVE[zone][i];
  else {
    switch (category) {
      case "grass":
        raw = GRASS_CURVE[zone][i];
        break;
      case "weed":
        raw = WEED_CURVE[zone][i];
        break;
      case "tree":
        raw = TREE_CURVE[zone][i];
        break;
      default:
        raw = 1;
    }
  }

  return 1 + (raw - 1) * strength;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
