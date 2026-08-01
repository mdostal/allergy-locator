import grassScores from "@data/allergy-scores.json";
import allergensData from "@data/allergens.json";
import cities from "@data/cities.json";
import { hasAllergen } from "@/lib/severity/gate";
import { getAllergen } from "@/lib/allergens/registry";
import { seasonMultiplier } from "@/lib/severity/season";
import { getDailyMultiplier, getDailyMultiplierForMonth } from "@/lib/severity/daily-curves";
import type { SeverityResult, SeverityTier } from "@/lib/severity/types";

const grassScoreIndex = new Map(grassScores.map((entry) => [entry.id, entry]));

const comprehensiveIndex = new Map(
  allergensData.scores.map((s) => [`${s.allergen_id}::${s.city_id}`, s]),
);

const koppenIndex = new Map(cities.map((c) => [c.id, c.koppen]));

/** Same boundaries the annual grass scores already fall into (data/allergy-
 * scoring.md) — reused here so a season-adjusted score still reads on the same
 * near-zero/low/moderate/high/worst scale as the unadjusted one. */
function tierForValue(value: number): SeverityTier {
  if (value < 15) return "near-zero";
  if (value < 35) return "low";
  if (value < 65) return "moderate";
  if (value < 89) return "high";
  return "worst";
}

/**
 * Per-allergen, per-city severity. Grass reads the already-validated,
 * ground-truth-fit values from data/allergy-scores.json (MAE 2.3 — see
 * data/allergy-scoring.md). Every other allergen reads data/allergens.json
 * (story s3) and is always `confidence: "modeled"` — never silently reported
 * with grass's rigor.
 *
 * `month` (1-12, story s6) is optional and backward-compatible: omitted, this
 * returns the unmodified annual score exactly as before. Provided, the annual
 * score is treated as that allergen's PEAK-season severity for the city's
 * climate zone and scaled down for other months via lib/severity/season.ts.
 * `seasonStrength` (Advanced mode, lib/model-settings.ts) passes through to
 * that same curve unchanged when omitted.
 *
 * `day` (1-31, optional) requests an EXACT calendar day rather than the
 * month's representative mid-month value -- used by the trip planner, which
 * needs real day-level precision, not just "this month." Whenever this city
 * is one of the 168 with a real NOAA-daily-normal-derived curve
 * (data/daily-season-curves.json), that real per-day data is used instead of
 * the coarser 4-climate-zone-group monthly model automatically -- this is a
 * transparent upgrade for every existing month-granularity caller too (the
 * main map, playback, reports), not just the trip planner.
 */
export function getSeverity(
  allergenId: string,
  cityId: string,
  month?: number,
  seasonStrength?: number,
  day?: number,
): SeverityResult | null {
  if (!hasAllergen(allergenId, cityId)) {
    return null;
  }

  function applySeason(value: number): number {
    if (!month) return value;
    const allergen = getAllergen(allergenId);
    if (!allergen) return value;

    const daily = day
      ? getDailyMultiplier(cityId, allergenId, allergen.category, month, day, seasonStrength)
      : getDailyMultiplierForMonth(cityId, allergenId, allergen.category, month, seasonStrength);
    if (daily !== null) return Math.round(value * daily);

    const koppen = koppenIndex.get(cityId);
    if (!koppen) return value;
    const multiplier = seasonMultiplier(allergenId, allergen.category, koppen, month, seasonStrength);
    return Math.round(value * multiplier);
  }

  if (allergenId === "grass") {
    const entry = grassScoreIndex.get(cityId);
    if (!entry) return null;
    const value = applySeason(entry.score);
    return {
      value,
      tier: month ? tierForValue(value) : (entry.tier as SeverityTier),
      confidence: "validated",
      why: entry.why,
      components: {
        base_season_climate: entry.base_season_climate,
        turf_boost: entry.turf_boost,
        arid_weed: entry.arid_weed,
        elevation_discount: entry.elevation_discount,
        coastal_nudge: entry.coastal_nudge,
      },
    };
  }

  const entry = comprehensiveIndex.get(`${allergenId}::${cityId}`);
  if (!entry) return null;
  const value = applySeason(entry.score);
  return {
    value,
    tier: month ? tierForValue(value) : (entry.tier as SeverityTier),
    confidence: "modeled",
    why: entry.why,
  };
}
