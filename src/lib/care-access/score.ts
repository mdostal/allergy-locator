import careAccessData from "@data/care-access.json";

export type CareAccessLayer = "pediatric_cardiac" | "pediatric_specialty" | "general";

export const CARE_ACCESS_LAYERS: Array<{ id: CareAccessLayer; label: string }> = [
  { id: "general", label: "General / emergency care" },
  { id: "pediatric_specialty", label: "Pediatric specialty" },
  { id: "pediatric_cardiac", label: "Pediatric cardiac surgery" },
];

export interface CareAccessResult {
  /** 0-100, higher = WORSE access (farther from care) -- deliberately the
   * same "higher = more concerning" convention as allergy severity, so the
   * existing green->red compositeColor() ramp works unmodified for this
   * dataset too, without a per-dataset inverted palette. */
  value: number;
  tier: string;
  nearestFacility: string;
  facilityCity: string;
  driveMinutes: number;
}

interface FacilityResult {
  nearest_facility: string;
  facility_city: string;
  distance_mi: number;
  est_drive_min: number;
  tier: string;
}

interface CareAccessRecord {
  city: string;
  pediatric_cardiac: FacilityResult;
  pediatric_specialty: FacilityResult;
  general: FacilityResult;
}

const DATA = careAccessData as unknown as Record<string, CareAccessRecord | { description: string }>;

/**
 * Tier -> concern-score mapping is a documented, editable default (same
 * pattern as classToSensitivity in lib/panel-import/match-allergen.ts) --
 * directly reflects the 4 tiers care-access.json's own _meta already
 * defines, not a synthetic continuous formula invented beyond what the
 * source data distinguishes.
 */
const TIER_TO_CONCERN: Record<string, number> = {
  "<=30": 5,
  "<=60": 35,
  "<=120": 70,
  "120+": 95,
};

export function getCareAccess(cityId: string, layer: CareAccessLayer): CareAccessResult | null {
  const record = DATA[cityId];
  if (!record || !("pediatric_cardiac" in record)) return null;
  const result = record[layer];
  if (!result) return null;

  return {
    value: TIER_TO_CONCERN[result.tier] ?? 50,
    tier: result.tier,
    nearestFacility: result.nearest_facility,
    facilityCity: result.facility_city,
    driveMinutes: result.est_drive_min,
  };
}
