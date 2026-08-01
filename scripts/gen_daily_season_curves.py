#!/usr/bin/env python3
"""Generate data/daily-season-curves.json -- a real, per-city, day-of-year
(366-point) season-position multiplier for grass/tree/weed/mold, replacing
the coarse 4-climate-zone-group monthly model in lib/severity/season.ts with
one driven by each city's ACTUAL NOAA daily temperature normals (see
scripts/fetch_daily_normals.py) instead of a shared bucket assumption.

This keeps the same convention the existing model already uses (documented
in season.ts and score.ts): the annual/ground-truth score is that allergen's
PEAK-season severity, and this curve is a 0-1 multiplier on top of it, always
peaking at exactly 1.0 for every city (so "at your peak day" reproduces the
authoritative annual score exactly, and other days scale down from there).

Model: a temperature-response "suitability" function per category (grass/
tree/weed/cladosporium), using each day's real normal mean temperature and
whether the year is locally warming or cooling at that point (a real,
data-derived spring-vs-fall distinction, not an assumption) -- grounded in
the same phenology logic already established in lib/severity/season.ts's
static curves (spring tree bloom, broad-summer grass, late-season weeds,
warm/humid-correlated Cladosporium), just computed per-city from real data
instead of a shared 4-zone-group table. Alternaria keeps its existing FLAT
curve unchanged (the Denver aerobiology study behind it found no strong
weather correlation for that genus -- resampled to daily resolution via
smooth interpolation of the same 12 monthly points, not re-modeled).
"""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")

DAYS_IN_YEAR = 366


def load_daily_normals():
    with open(os.path.join(RAW_DIR, "city_daily_normals.json")) as f:
        return json.load(f)


def fill_gaps(values):
    """Linear-interpolate any missing (None) days using their neighbors --
    a handful of days are occasionally missing at even good stations."""
    n = len(values)
    result = list(values)
    for i in range(n):
        if result[i] is not None:
            continue
        # find nearest valid neighbors (wrapping)
        prev_i, next_i = None, None
        for back in range(1, n):
            if result[(i - back) % n] is not None:
                prev_i = (i - back) % n
                break
        for fwd in range(1, n):
            if result[(i + fwd) % n] is not None:
                next_i = (i + fwd) % n
                break
        if prev_i is None or next_i is None:
            result[i] = 55.0  # degenerate fallback, shouldn't happen given the fetch script's own guarantee
            continue
        span = (next_i - prev_i) % n or n
        frac = ((i - prev_i) % n) / span
        result[i] = result[prev_i] + (result[next_i] - result[prev_i]) * frac
    return result


def compute_rising_mask(tavg):
    """True for every day between the year's coldest and warmest normal day
    (the "spring" half), False for the complementary "fall" half. Global
    min/max rather than a local day-over-day derivative: a local lag-based
    trend check is fooled by ordinary short-term wiggles in mild-winter
    climates (real finding, not a guess -- an early version of this script
    using a 14-day lag put Austin's tree-pollen peak in January, chasing a
    brief winter warm spell, instead of the real March-April bloom)."""
    n = len(tavg)
    day_min = tavg.index(min(tavg))
    day_max = tavg.index(max(tavg))
    rising = [False] * n
    d = day_min
    while d != day_max:
        rising[d] = True
        d = (d + 1) % n
    rising[day_max] = True
    return rising


def compute_spring_mask(tavg, buffer_deg=10):
    """Stricter than compute_rising_mask: True only once temperature has
    climbed at least `buffer_deg` above the annual minimum. Needed
    specifically for tree bud-break/flowering, which is chill-release-gated
    biology, not just "warmer than the single coldest day" -- a mild-winter
    city's coldest normal day can already sit inside a plain temperature
    trapezoid's bloom range (real finding: Austin's coldest normal day is
    47.7F, already inside a 35-72F tree window, which put its modeled tree
    peak on the coldest day of the year without this buffer)."""
    n = len(tavg)
    day_min = tavg.index(min(tavg))
    day_max = tavg.index(max(tavg))
    min_val = tavg[day_min]
    mask = [False] * n
    d = day_min
    while d != day_max:
        mask[d] = tavg[d] >= min_val + buffer_deg
        d = (d + 1) % n
    mask[day_max] = tavg[day_max] >= min_val + buffer_deg
    return mask


def trapezoid(t, t_low, t_peak_low, t_peak_high, t_high):
    if t <= t_low or t >= t_high:
        return 0.0
    if t < t_peak_low:
        return (t - t_low) / (t_peak_low - t_low)
    if t <= t_peak_high:
        return 1.0
    return (t_high - t) / (t_high - t_peak_high)


# Alternaria's existing flat, non-weather-driven monthly curve (season.ts),
# resampled to daily via smooth (Catmull-Rom-ish) interpolation between month
# midpoints -- kept as-is deliberately, not re-modeled from temperature.
ALTERNARIA_MONTHLY = [0.3, 0.3, 0.35, 0.4, 0.5, 0.65, 0.85, 1.0, 0.9, 0.6, 0.4, 0.3]


def alternaria_daily_curve():
    # Month midpoints in day-of-year (non-leap approximation is fine for a
    # smooth resample), then linear-interpolate between them across 366 days.
    midpoints = [15, 45, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
    curve = [0.0] * DAYS_IN_YEAR
    for day in range(DAYS_IN_YEAR):
        # find surrounding midpoints (wrapping)
        for i in range(12):
            m0, m1 = midpoints[i], midpoints[(i + 1) % 12]
            span = (m1 - m0) % 366 or 366
            offset = (day - m0) % 366
            if offset <= span:
                frac = offset / span
                v0, v1 = ALTERNARIA_MONTHLY[i], ALTERNARIA_MONTHLY[(i + 1) % 12]
                curve[day] = v0 + (v1 - v0) * frac
                break
    peak = max(curve)
    return [round(v / peak, 4) for v in curve]


def build():
    daily_normals = load_daily_normals()
    alternaria_curve = alternaria_daily_curve()

    out = {}
    for city_id, rec in daily_normals.items():
        tavg = fill_gaps([d["tavg_f"] if d else None for d in rec["days"]])
        # NOAA uses -9999 as a missing-value sentinel; real precipitation can
        # never be negative. A real bug caught by tests/daily-curves.test.ts:
        # this sentinel parsed as a valid (garbage) float upstream, and once
        # divided into the humidity-boost term below it produced wildly
        # negative Cladosporium values across every dry-climate city (LA,
        # Phoenix, Las Vegas, etc. -- anywhere with real near-zero rainfall
        # normals, which made the corrupted denominator especially explosive).
        prcp = fill_gaps([(d.get("prcp_in") if d and (d.get("prcp_in") or 0) >= 0 else None) for d in rec["days"]])
        prcp_max = max(prcp) or 1.0

        rising_mask = compute_rising_mask(tavg)
        spring_mask = compute_spring_mask(tavg)

        grass, tree, weed, cladosporium = [], [], [], []
        for day in range(DAYS_IN_YEAR):
            t = tavg[day]
            rising = rising_mask[day]

            grass.append(trapezoid(t, 45, 65, 90, 100))

            tree_base = trapezoid(t, 35, 45, 62, 72)
            tree.append(tree_base * (1.0 if spring_mask[day] else 0.05))

            weed_base = trapezoid(t, 42, 60, 82, 95)
            weed.append(weed_base * (0.5 if rising else 1.0))

            humidity_boost = 1.0 + 0.25 * (prcp[day] / prcp_max)
            cladosporium.append(trapezoid(t, 40, 60, 85, 95) * humidity_boost)

        def normalize(values):
            peak = max(values)
            if peak <= 0:
                # Degenerate case, real and expected for some city/category
                # combinations: e.g. Honolulu's always-warm tropical climate
                # never drops into the temperate tree-bloom temperature
                # window (35-72F), so the trapezoid never fires and every day
                # is a true zero. Dividing by that zero peak would either
                # error or (as originally written) silently zero out every
                # day when multiplied against the real annual score -- flat
                # 1.0 (no seasonal adjustment) is the honest fallback when
                # there's no real signal to shape a curve from, consistent
                # with season.ts's own "unknown category returns multiplier
                # 1" convention.
                return [1.0] * len(values)
            return [round(v / peak, 4) for v in values]

        out[city_id] = {
            "station_id": rec["station_id"],
            "grass": normalize(grass),
            "tree": normalize(tree),
            "weed": normalize(weed),
            "cladosporium": normalize(cladosporium),
            "alternaria": alternaria_curve,
        }

    out_path = os.path.join(DATA_DIR, "daily-season-curves.json")
    with open(out_path, "w") as f:
        json.dump(out, f)

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"Wrote {len(out)} cities x 366 days x 5 curves -> {out_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    build()
