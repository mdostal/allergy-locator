import type { AllergenConfidence } from "@/lib/allergens/registry";

export type SeverityTier = "near-zero" | "low" | "moderate" | "high" | "worst";

export interface SeverityResult {
  value: number; // 0-100
  tier: SeverityTier;
  confidence: AllergenConfidence;
  why: string;
  components?: Record<string, number>;
}
