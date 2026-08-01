import countyGrid from "@data/county-grid.json";
import { projectLatLon } from "@/lib/geo/projection";

/**
 * The county-grid gradient-densification layer (see data/county-grid-
 * methodology.md): 3,143 counties, real Census/USGS/NASS-derived samples
 * that ONLY feed the heatmap's spatial interpolation. Never used for city
 * markers, the detail panel, or reports -- those stay on the 168
 * authoritative, ground-truth-anchored cities in data/cities.json,
 * unchanged.
 */
export interface CountyPoint {
  fips: string;
  x: number;
  y: number;
  koppen: string;
  scores: Record<string, number>;
}

export const COUNTY_POINTS: CountyPoint[] = countyGrid.counties
  .map((c): CountyPoint | null => {
    const xy = projectLatLon(c.lat, c.lon);
    if (!xy) return null;
    return { fips: c.fips, x: xy[0], y: xy[1], koppen: c.koppen, scores: c.scores };
  })
  .filter((p): p is CountyPoint => p !== null);
