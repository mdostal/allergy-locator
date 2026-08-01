# Daily season curves — real per-city phenology, day-level resolution

`data/daily-season-curves.json` upgrades story s6's month-granularity season
model to real day-by-day resolution, per explicit user direction: "if we can
get TRUE data and smooth it out for the play to go daily through the months
that would be WAY preferred."

## What's real

**NOAA NCEI U.S. Daily Climate Normals (1991-2020)** — public domain, keyless,
station-level CSVs at
`https://www.ncei.noaa.gov/data/normals-daily/1991-2020/access/{station}.csv`.
Each of the 168 cities is matched to its nearest **full-climate** GHCN station
(temperature + precipitation; CoCoRaHS `US1...` volunteer rain-gauge stations
and `USS...` snow-network stations are explicitly excluded — a real
data-quality finding, not a guess: the first matching pass put 78/168 cities
on a temperature-free station). Every city's daily mean temperature normal
(`DLY-TAVG-NORMAL`) and 50th-percentile precipitation (`DLY-PRCP-50PCTL`) for
all 366 days of the year (NOAA always emits a leap-year-shaped 366-row file)
are real, measured, 30-year climate normals — not modeled.

Refresh via `python3 scripts/fetch_daily_normals.py` (idempotent, cached,
re-run periodically for newer NOAA releases) then
`python3 scripts/gen_daily_season_curves.py` to regenerate the derived
curves.

## What's modeled

The curves themselves — grass/tree/weed/Cladosporium suitability as a
function of each city's *real* daily temperature (and, for Cladosporium,
precipitation/humidity) — are a temperature-response phenology model, not
measured pollen counts (no such daily/monthly dataset is legally available to
this project — see `README.md`'s NAB entry). Each category uses a trapezoid
response function (rises, plateaus, falls across a plausible temperature
band) grounded in the same general phenology already established in
`lib/severity/season.ts`'s coarser 4-zone-group monthly model:

- **Grass**: broad-summer plateau, 45-100°F.
- **Tree**: a narrower spring-bloom window (35-72°F), gated to the "spring"
  half of the year via a real, data-derived warming/cooling signal (see
  below) — trees don't rebloom on an ordinary autumn warm day.
- **Weed**: a broader, later-season window (42-95°F), biased toward the
  "fall" half of the year.
- **Cladosporium**: temperature-driven with a real humidity boost from each
  day's actual precipitation normal, consistent with the Denver aerobiology
  study behind the existing model (`data/allergens-scoring.md`).
- **Alternaria**: unchanged from the existing flat, non-weather-driven
  monthly curve, smoothly resampled to daily resolution — the same Denver
  study found no strong weather correlation for this genus, so it is
  deliberately NOT re-modeled from temperature.

Every curve is normalized so its peak is always exactly `1.0` — the existing
convention (an allergen's annual/ground-truth score is its peak-season
severity) holds exactly, at daily as well as monthly resolution.

## Real bugs caught and fixed during generation (not merely anticipated)

1. **Wrong station type.** 78/168 initial city→station matches landed on
   CoCoRaHS/snow-network stations with zero temperature data. Fixed by
   filtering to full-climate (`USC`/`USW`) stations only, with a nearest-8
   fallback search for the remainder.
2. **False spring detection.** A local day-over-day temperature trend check
   put Austin's modeled tree-pollen peak in **January** — chasing an ordinary
   winter warm spell in a mild-winter city, not the real March-April bloom.
   Fixed with a global min/max-anchored "spring half of the year" mask, plus
   a minimum-degrees-above-the-annual-low buffer specifically for tree
   bud-break (chill-release-gated biology, not just "warmer than the coldest
   day").
3. **NOAA's `-9999` missing-value sentinel.** Parsed as a valid (very
   negative) float, this corrupted the Cladosporium humidity term across
   every dry-climate city (LA, Phoenix, Las Vegas, Reno, Boise, and 40+
   others) into wildly negative, out-of-range curve values. Fixed by
   rejecting negative precipitation values before they enter the model.
4. **Degenerate all-zero curves.** Honolulu's always-warm tropical climate
   never drops into the temperate tree-bloom temperature window, so its
   modeled tree curve was genuinely all-zero — which broke the "always peaks
   at 1.0" invariant when naively normalized (divide-by-zero). Fixed with an
   explicit flat (`1.0`, no seasonal adjustment) fallback for any city/
   category combination with no real signal to shape a curve from.

All four were caught by the test suite (`tests/daily-curves.test.ts`)
checking every one of the 168 cities' full 366-value curves, not a sample —
a partial check would have missed several of these (they only affected
specific climates).

## How this plugs into the app

`lib/severity/daily-curves.ts` exposes `getDailyMultiplier(cityId, allergenId,
category, month, day, strength)`. `lib/severity/score.ts`'s `getSeverity`
tries this first for any of the 168 cities; only when a city has no daily
curve (or an allergen category isn't modeled here, e.g. non-Cladosporium mold
species) does it fall back to the coarser `seasonMultiplier` 4-zone-group
model. This is a transparent upgrade — every existing month-granularity
caller (the main map, "play the year," reports) benefits automatically,
alongside the new Trip Planner, which is the first surface to expose full
day-level precision end to end.
