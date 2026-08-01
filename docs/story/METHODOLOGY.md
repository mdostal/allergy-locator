# Methodology — every formula, every source, honestly labeled

This map runs on open data and a handful of formulas, all listed here. Nothing
is measured pollen data pretending to be more certain than it is — every
number on this map is either a real public dataset, or a model built from
real public data and clearly marked as modeled. Where the model's assumptions
matter, they're spelled out below, along with **Advanced mode** (the "Show
advanced" toggle on the map) — the parameters listed as "live-adjustable"
there genuinely recompute the map when you move them, not just relabel a
fixed result.

## Grass — the one validated model

Grass is the only allergen fit against real, lived ground-truth reactions
(MAE 2.3 against a documented panel of anchor cities — see `data/allergy-scoring.md`
for the full derivation). Every city's score is:

```
score = base_season_climate(Koppen zone, latitude)
      + turf_boost(irrigated/planted turf, grass-seed-farming region)
      + arid_weed(desert Southwest weed + dust load)
      + elevation_discount(dry, high-elevation shortens the season)
      + coastal_nudge(ocean moderation)
```

Each component is broken out in the map's detail panel for every city — this
is the one place the model shows its full arithmetic, not just a final number.

## Every other allergen (28 species) — modeled from climate zone + presence

None of the other 28 allergens have an equivalent ground-truth fit. Each is
scored from a Köppen-climate-zone severity table (grounded in real
aerobiology/agricultural-extension literature — see `data/allergens-scoring.md`
for sources per allergen, including why Cladosporium and Alternaria mold get
genuinely different curves) plus, for 9 species with real USDA PLANTS
state-presence data, a hard presence gate. Every one of these is labeled
**"modeled, not ground-truth-validated"** everywhere it appears in the app —
never silently presented with grass's rigor.

## Season-position scoring — real, per-city, day-by-day curves

Each allergen's annual score is treated as its **peak-season** severity,
scaled down for other times of year. For each of the 168 named cities, that
scaling is a genuinely **daily** curve — driven by real NOAA 1991-2020 daily
climate normals (measured temperature and precipitation, not modeled) run
through a temperature-response phenology model per allergen category. Full
methodology, real data sources, and every bug caught fixing it, in
`data/daily-season-curves-methodology.md`. Any location without a matched
daily curve falls back to the coarser month-indexed, climate-zone-group model
it replaced. **Advanced mode's "Season curve strength" slider** runs this
exact curve at 0-100% intensity live — 0% flattens every day to the annual/
peak score; 100% is the curve as modeled.

## Trip planner — forecasting a specific date range

Pick a destination and a departure/return date in **Mode 2 ("My map")** and
the Trip Planner computes your personalized composite score for every real
calendar day of the trip, using the same day-by-day curves above. This is a
**climatological forecast** — what a typical year looks like at that
location, not a prediction of the specific year's actual weather (no weather
forecast, paid or otherwise, is used anywhere in this project).

## "My map" — combining multiple allergens

The shipped default is **noisy-OR**: each active allergen contributes an
independent "risk" (`sensitivity × severity`), combined as
`1 - product(1 - risk_i)` — this compounds (never dilutes) when you're
sensitive to more than one thing, which is how real multi-allergen exposure
actually feels. **Advanced mode** exposes a live alternative,
**sensitivity-weighted average**, for direct comparison — flip between them
and watch the score change on the spot.

## The gradient — how the map turns points into a continuous surface

The colored surface is Inverse Distance Weighting (IDW) interpolation across
two layers of sample points:

- **168 named cities** — the same city-level scores everywhere else in the
  app, unchanged and authoritative.
- **~3,143 counties** — a secondary, coarser-confidence layer built from real
  Census/USGS/USDA data that only exists to fill the huge gaps between named
  cities. Full sourcing, what's real vs. modeled, and a confirmed (not
  assumed) limitation around urban lawn irrigation are documented in
  `data/county-grid-methodology.md`.

**Advanced mode's "Gradient smoothness (IDW power)" slider** controls how
tightly the interpolation hugs each sample point versus blending smoothly
across the whole map — live, not cosmetic. Toggling on a 2nd+ allergen stacks
its own gradient layer at the **"Overlapping-layer opacity"** setting, also
live-adjustable.

## What's NOT live-adjustable (and why)

The grass ground-truth formula's own weights (turf multiplier, seed-valley
bonus, arid weight) and the county-grid turf model are computed once, at
build time, into static JSON files — not re-run in your browser on every
request. Making those live-tunable would mean moving that computation into
the client entirely, a real architecture change not attempted yet. Advanced
mode exposes everything that already runs live; it doesn't fake controls for
things that don't.

## Data refresh

The county grid's source data (Census, USGS, USDA NASS, elevation) is a
static snapshot, not a live feed — `scripts/fetch_county_data.py` re-pulls it
on demand, and `scripts/gen_county_grid.py` regenerates the derived scores.
Neither runs automatically; re-run them periodically to pick up newer
government data releases.

---
*Not medical advice. Directional, and only as good as open public data
allows. Get your own panel read by an allergist and treat every number here
as one input among many.*
