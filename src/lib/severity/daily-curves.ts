import dailyCurves from "@data/daily-season-curves.json";

type DailyCurveSet = {
  station_id: string;
  grass: number[];
  tree: number[];
  weed: number[];
  cladosporium: number[];
  alternaria: number[];
};

const CURVES = dailyCurves as unknown as Record<string, DailyCurveSet>;

const CURVE_KEYS = new Set(["grass", "tree", "weed", "cladosporium", "alternaria"]);

function curveKeyFor(allergenId: string, category: string): string | null {
  if (allergenId === "alternaria" || allergenId === "cladosporium") return allergenId;
  if (CURVE_KEYS.has(category)) return category;
  return null; // mold-category allergens other than the two species above aren't modeled here
}

export function hasDailyCurve(cityId: string): boolean {
  return cityId in CURVES;
}

/** NOAA's daily-normals files always emit exactly 366 rows including Feb 29
 * (a normals product isn't tied to any specific real year) -- this table has
 * to assume a leap-year calendar to index into that array correctly, not a
 * regular year's 365-day layout. */
const CUMULATIVE_DAYS = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

export function dayOfYear(month: number, day: number): number {
  return CUMULATIVE_DAYS[Math.min(11, Math.max(0, month - 1))] + Math.max(1, day) - 1;
}

/**
 * Real, per-city NOAA-daily-normal-driven multiplier (data/daily-season-
 * curves.json, see data/daily-season-curves.json's generator script for the
 * full methodology) for an exact calendar day. Returns null when this city
 * isn't in the 168-city daily-curve set (e.g. any future non-city location)
 * so callers fall back to the coarser 4-zone-group monthly model.
 */
export function getDailyMultiplier(
  cityId: string,
  allergenId: string,
  category: string,
  month: number,
  day: number,
  strength = 1,
): number | null {
  const curveSet = CURVES[cityId];
  if (!curveSet) return null;
  const key = curveKeyFor(allergenId, category);
  if (!key) return null;
  const curve = curveSet[key as keyof Omit<DailyCurveSet, "station_id">];
  const raw = curve[dayOfYear(month, day)];
  return 1 + (raw - 1) * strength;
}

/** Month-representative value (day 15) for the existing month-granularity UI
 * (map controls, playback, reports) -- lets those surfaces transparently
 * benefit from real per-city data without changing their API shape. */
export function getDailyMultiplierForMonth(
  cityId: string,
  allergenId: string,
  category: string,
  month: number,
  strength = 1,
): number | null {
  return getDailyMultiplier(cityId, allergenId, category, month, 15, strength);
}
