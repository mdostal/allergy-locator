import cities from "@data/cities.json";
import { getComposite } from "@/lib/severity/composite";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const LOW_THRESHOLD = 35; // near-zero/low tiers -- a genuinely easy month
const HIGH_THRESHOLD = 65; // high/worst tiers -- a genuinely rough month

export interface CityMonthScore {
  cityId: string;
  city: string;
  state: string;
  month: number;
  value: number;
}

interface CityAnnualProfile {
  cityId: string;
  city: string;
  state: string;
  monthly: number[]; // 12 values, index 0 = January
  best: { month: number; value: number };
  worst: { month: number; value: number };
  average: number;
}

export interface SeasonalWindow {
  cityId: string;
  city: string;
  state: string;
  average: number;
  lowWindow: string | null; // e.g. "Apr-Jun" -- months genuinely easy
  highWindow: string | null; // e.g. "Aug" -- months genuinely rough
}

export interface Report {
  bestTimePlace: CityMonthScore;
  worstAvoid: Array<{ cityId: string; city: string; state: string; floor: number }>;
  seasonalWindows: SeasonalWindow[];
}

function monthRangeLabel(months: number[]): string | null {
  if (months.length === 0) return null;
  const sorted = [...months].sort((a, b) => a - b);
  const runs: Array<[number, number]> = [];
  let runStart = sorted[0];
  let runEnd = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === runEnd + 1) {
      runEnd = sorted[i];
    } else {
      runs.push([runStart, runEnd]);
      runStart = sorted[i];
      runEnd = sorted[i];
    }
  }
  runs.push([runStart, runEnd]);
  return runs
    .map(([start, end]) =>
      start === end ? MONTH_ABBR[start - 1] : `${MONTH_ABBR[start - 1]}-${MONTH_ABBR[end - 1]}`,
    )
    .join(", ");
}

function buildProfiles(sensitivities: Record<string, number>): CityAnnualProfile[] {
  const profiles: CityAnnualProfile[] = [];
  for (const city of cities) {
    const monthly: number[] = [];
    for (let month = 1; month <= 12; month++) {
      const composite = getComposite(sensitivities, city.id, month);
      monthly.push(composite ? composite.value : NaN);
    }
    if (monthly.every((v) => Number.isNaN(v))) continue;

    let best = { month: 1, value: Infinity };
    let worst = { month: 1, value: -Infinity };
    let sum = 0;
    let count = 0;
    monthly.forEach((value, i) => {
      if (Number.isNaN(value)) return;
      const month = i + 1;
      if (value < best.value) best = { month, value };
      if (value > worst.value) worst = { month, value };
      sum += value;
      count += 1;
    });

    profiles.push({
      cityId: city.id,
      city: city.city,
      state: city.state,
      monthly,
      best,
      worst,
      average: sum / count,
    });
  }
  return profiles;
}

/**
 * Story s8: the concrete "by the end of this" deliverable -- a report computed
 * across the FULL 168-city x 12-month matrix (2016 composite calls) for the
 * active Mode 2 sensitivity profile, not a hardcoded or pre-sampled subset.
 * Returns null only when no allergen has a nonzero sensitivity (nothing to
 * report on), matching getComposite's own null convention.
 */
export function generateReport(sensitivities: Record<string, number>, topN = 5): Report | null {
  const profiles = buildProfiles(sensitivities);
  if (profiles.length === 0) return null;

  // At the extreme low end, many climate zones' off-season multiplier rounds a
  // city's score down to a literal 0 -- several dozen cities can tie there in
  // the same winter month. Break ties by year-round average so the pick is a
  // genuinely good PLACE with a good TIME, not just whichever city happens to
  // floor to zero first in iteration order.
  let bestTimePlace = profiles[0];
  for (const p of profiles) {
    if (p.best.value < bestTimePlace.best.value) {
      bestTimePlace = p;
    } else if (p.best.value === bestTimePlace.best.value && p.average < bestTimePlace.average) {
      bestTimePlace = p;
    }
  }

  // "Avoid entirely" = cities with no good time to visit -- ranked by how bad
  // their BEST month still is, not their worst (their worst is obvious; the
  // useful warning is "even the easy season here is bad for you").
  const worstAvoid = [...profiles]
    .sort((a, b) => b.best.value - a.best.value)
    .slice(0, topN)
    .map((p) => ({ cityId: p.cityId, city: p.city, state: p.state, floor: p.best.value }));

  const seasonalWindows = [...profiles]
    .sort((a, b) => a.average - b.average)
    .slice(0, topN)
    .map((p) => {
      const lowMonths = p.monthly
        .map((v, i) => ({ v, month: i + 1 }))
        .filter((x) => x.v <= LOW_THRESHOLD)
        .map((x) => x.month);
      const highMonths = p.monthly
        .map((v, i) => ({ v, month: i + 1 }))
        .filter((x) => x.v >= HIGH_THRESHOLD)
        .map((x) => x.month);
      return {
        cityId: p.cityId,
        city: p.city,
        state: p.state,
        average: Math.round(p.average),
        lowWindow: monthRangeLabel(lowMonths),
        highWindow: monthRangeLabel(highMonths),
      };
    });

  return {
    bestTimePlace: {
      cityId: bestTimePlace.cityId,
      city: bestTimePlace.city,
      state: bestTimePlace.state,
      month: bestTimePlace.best.month,
      value: bestTimePlace.best.value,
    },
    worstAvoid,
    seasonalWindows,
  };
}
