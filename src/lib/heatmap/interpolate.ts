/**
 * Inverse Distance Weighting (IDW) interpolation over the 168-city point
 * spine, producing a continuous grid so the map can render a real gradient
 * surface (docs/ROADMAP.md's "Phase 2" ask, now pulled forward per explicit
 * user direction: "the single dot on the city is the biggest issue"). This is
 * a value SURFACE derived from the same city-level scores every other part of
 * the app already uses -- not a new data source, and not the eventual
 * county/raster-granularity engine ROADMAP.md describes; it's the cheapest
 * honest way to stop rendering severity as isolated dots given only 168
 * sample points, entirely client-side.
 *
 * IDW is the standard, simplest spatial interpolator for scattered point data
 * (no external dependency, O(cells * points) which is trivially fast at this
 * scale -- see the perf test in tests/heatmap.test.ts).
 */

export interface DataPoint {
  x: number;
  y: number;
  value: number;
}

export interface GridCell {
  value: number | null;
}

export interface GridOptions {
  cols: number;
  rows: number;
  width: number;
  height: number;
  /** IDW power parameter -- higher values make the surface hug closer to
   * each sample point (more distinct regional "blobs"); lower values blend
   * more smoothly across the whole map. */
  power?: number;
}

const DEFAULT_POWER = 2.5;

/**
 * Returns a `rows`-by-`cols` matrix of interpolated values across the
 * `width`x`height` coordinate space. A cell exactly on (or extremely close
 * to) a sample point returns that point's value directly, avoiding IDW's
 * 1/distance singularity. An empty `points` array returns an all-null grid
 * rather than throwing -- there is nothing to interpolate from.
 */
export function buildInterpolationGrid(points: DataPoint[], options: GridOptions): GridCell[][] {
  const { cols, rows, width, height, power = DEFAULT_POWER } = options;
  const grid: GridCell[][] = [];

  if (points.length === 0) {
    for (let r = 0; r < rows; r++) {
      grid.push(Array.from({ length: cols }, () => ({ value: null })));
    }
    return grid;
  }

  const cellWidth = width / cols;
  const cellHeight = height / rows;

  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    const cy = (r + 0.5) * cellHeight;
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * cellWidth;
      row.push({ value: interpolateAt(cx, cy, points, power) });
    }
    grid.push(row);
  }

  return grid;
}

function interpolateAt(x: number, y: number, points: DataPoint[], power: number): number {
  let weightedSum = 0;
  let weightSum = 0;

  for (const point of points) {
    const dx = x - point.x;
    const dy = y - point.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < 0.01) {
      return point.value; // effectively on top of a sample point
    }

    const weight = 1 / Math.pow(distanceSquared, power / 2);
    weightedSum += weight * point.value;
    weightSum += weight;
  }

  return weightedSum / weightSum;
}
